import { isExpired, startTokenAutoRefresh, stopTokenAutoRefresh } from '~/autoRefreshToken';
import { type BearAuth } from '~/create';
import { BearAuthError } from '~/errors';
import { getInstance } from '~/instances';
import { runOnAuthStateChangedCallbacks } from '~/onAuthStateChanged';
import { persistAuthSession } from '~/storage';
import {
    setRefreshingSession,
    setUnauthenticatedSession,
    updateSessionAfterRefreshToken,
    type RefreshingSession,
    type Session,
} from '~/store/session';

import { MAX_RETRY_COUNT, resolveRetry, type Retry } from './utils/retry';

type AuthData<AuthInfo> = RefreshingSession<AuthInfo>['data'];

export type RefreshTokenHook<AuthInfo> = {
    handler: (authSession: AuthData<AuthInfo>) => Promise<AuthData<AuthInfo>>;
    action: (props?: { forceUpdate?: boolean }) => Promise<Session<AuthInfo>>;
};

/**
 * - Set a function to make API call to your app's backend and fetch fresh access token.
 * - Required when the `authenticaion` method returns `refreshToken` & `expiration` properties.
 * @param instanceId - return value of `create` method
 * @param handler - function to refresh the access token
 * @returns
 */
export function setRefreshTokenHook<AuthInfo, AuthHook extends RefreshTokenHook<AuthInfo> = RefreshTokenHook<AuthInfo>>(
    instanceId: BearAuth<AuthInfo>['id'],
    handler: AuthHook['handler'],
    options?: {
        retry: Retry;
    },
): AuthHook['action'] {
    async function refreshToken(retrievedAuthSession?: AuthData<AuthInfo>, failureCount = 0) {
        const instance = getInstance<AuthInfo>(instanceId);

        if (!retrievedAuthSession && instance.state.session.status !== 'authenticated') {
            throw new BearAuthError(
                'bear-auth/not-authenticated',
                `Can't refresh access token. No auth sesssion active.`,
            );
        }

        setRefreshingSession<AuthInfo>(instanceId);

        await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

        stopTokenAutoRefresh<AuthInfo>(instanceId);

        try {
            instance.logger.debug('[refreshToken]', 'Refreshing access token...');

            await instance.continueWhenOnline();

            const { session } = instance.state;
            const authSession = retrievedAuthSession ?? (session.data as AuthData<AuthInfo>);

            const result = await handler(authSession);

            instance.logger.debug('[refreshToken]', 'Received refresh access token result:', result);

            updateSessionAfterRefreshToken<AuthInfo>(instanceId, result);

            if (!retrievedAuthSession) {
                await persistAuthSession<AuthInfo>(instanceId);
            }

            startTokenAutoRefresh<AuthInfo>(instanceId);

            instance.logger.debug('[refreshToken]', 'Access token has been successfully refreshed.');

            await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

            return getInstance<AuthInfo>(instanceId).state.session;
        } catch (error) {
            instance.logger.error(error);

            failureCount++;

            if ((await resolveRetry(options?.retry, error, failureCount)) && failureCount < MAX_RETRY_COUNT) {
                return refreshToken(retrievedAuthSession, failureCount);
            } else {
                setUnauthenticatedSession<AuthInfo>(instanceId);

                await instance.storage?.clear(instanceId);

                await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

                throw new BearAuthError('bear-auth/refresh-token-failed', 'Failed to refresh access token', error);
            }
        }
    }

    const instance = getInstance<AuthInfo>(instanceId);

    instance.hooks.refreshToken = refreshToken;

    const triggerRefreshToken: AuthHook['action'] = async options => {
        const instance = getInstance<AuthInfo>(instanceId);

        if (options?.forceUpdate || isExpired(instance.state.session.data?.expiration)) {
            return await refreshToken();
        }

        return getInstance<AuthInfo>(instanceId).state.session;
    };

    return triggerRefreshToken;
}
