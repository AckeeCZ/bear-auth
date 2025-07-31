import { isExpired, startTokenAutoRefresh, stopTokenAutoRefresh } from '../autoRefreshToken.ts';
import { type BearAuth } from '../create.ts';
import { BearAuthError } from '../errors.ts';
import { getInstance } from '../instances.ts';
import { runOnAuthStateChangedCallbacks } from '../onAuthStateChanged.ts';
import { persistAuthSession } from '../storage.ts';
import {
    setRefreshingSession,
    setUnauthenticatedSession,
    updateSessionAfterRefreshToken,
    type RefreshingSession,
    type Session,
} from '../store/session.ts';
import { MAX_RETRY_COUNT, resolveRetry, type Retry } from './utils/retry.ts';

type AuthData<AuthInfo> = RefreshingSession<AuthInfo>['data'];

export type RefreshTokenHook<AuthInfo> = {
    handler: (authSession: AuthData<AuthInfo>) => Promise<AuthData<AuthInfo>>;
    action: (props?: { forceRefresh?: boolean }) => Promise<Session<AuthInfo>>;
};

/**
 * - Set a function to make API call to your app's backend and fetch fresh access token.
 * - Required when the `authenticaion` method returns `refreshToken` & `expiration` properties.
 * @param id - return value of `create` method
 * @param handler - function to refresh the access token
 * @returns
 */
export function setRefreshTokenHook<AuthInfo, AuthHook extends RefreshTokenHook<AuthInfo> = RefreshTokenHook<AuthInfo>>(
    id: BearAuth<AuthInfo>['id'],
    handler: AuthHook['handler'],
    options?: {
        retry: Retry;
    },
): AuthHook['action'] {
    async function refreshToken(retrievedAuthSession?: AuthData<AuthInfo>, failureCount = 0) {
        const instance = getInstance<AuthInfo>(id);

        if (!retrievedAuthSession && instance.state.session.status !== 'authenticated') {
            throw new BearAuthError(
                'bear-auth/not-authenticated',
                `Can't refresh access token. No auth sesssion active.`,
            );
        }

        setRefreshingSession<AuthInfo>(id);

        await runOnAuthStateChangedCallbacks<AuthInfo>(id);

        stopTokenAutoRefresh<AuthInfo>(id);

        try {
            instance.logger.debug('[refreshToken]', 'Refreshing access token...');

            await instance.continueWhenOnline('refreshToken');

            const { session } = instance.state;
            const authSession = retrievedAuthSession ?? (session.data as AuthData<AuthInfo>);

            instance.logger.debug('[refreshToken]', 'Using auth session:', authSession);

            const result = await handler(authSession);

            instance.logger.debug('[refreshToken]', 'Received refresh access token result:', result);

            updateSessionAfterRefreshToken<AuthInfo>(id, result);

            if (!retrievedAuthSession) {
                await persistAuthSession<AuthInfo>(id);
            }

            startTokenAutoRefresh<AuthInfo>(id);

            instance.logger.debug('[refreshToken]', 'Access token has been successfully refreshed.');

            await runOnAuthStateChangedCallbacks<AuthInfo>(id);

            return getInstance<AuthInfo>(id).state.session;
        } catch (error) {
            instance.logger.error(error);

            failureCount++;

            if ((await resolveRetry(options?.retry, error, failureCount)) && failureCount < MAX_RETRY_COUNT) {
                return refreshToken(retrievedAuthSession, failureCount);
            } else {
                setUnauthenticatedSession<AuthInfo>(id);

                await instance.storage?.clear(id);

                await runOnAuthStateChangedCallbacks<AuthInfo>(id);

                throw new BearAuthError('bear-auth/refresh-token-failed', 'Failed to refresh access token', error);
            }
        }
    }

    const instance = getInstance<AuthInfo>(id);

    instance.hooks.refreshToken = refreshToken;

    const triggerRefreshToken: AuthHook['action'] = async options => {
        const { state } = getInstance<AuthInfo>(id);

        // FIXME: if status is refreshing, return promise of currently refreshing task
        if (
            options?.forceRefresh ||
            (isExpired(state.session.data?.expiration) && state.session.status !== 'refreshing')
        ) {
            return await refreshToken();
        }

        return getInstance<AuthInfo>(id).state.session;
    };

    return triggerRefreshToken;
}
