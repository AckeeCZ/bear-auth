import { isExpired, startTokenAutoRefresh, stopTokenAutoRefresh } from '~/autoRefreshToken';
import { type BearAuth } from '~/create';
import { BearAuthError } from '~/errors';
import { getInstance } from '~/instances';
import { runOnAuthStateChangedCallbacks } from '~/onAuthStateChanged';
import { persistAuthSession } from '~/storage';
import { setRefreshingSession, setUnauthenticatedSession, updateSessionAfterRefreshToken } from '~/store/session';
import type { AuthSession } from '~/types';

import { MAX_RETRY_COUNT, resolveRetry, type Retry } from './utils/retry';

export type RefreshTookHandlerResult<AuthInfo> = {
    accessToken: string;
    refreshToken: string;
    expiration?: string | null;
    authInfo?: AuthInfo | null;
};

export type RefreshTokenHook<AuthInfo> = {
    handler: (authSession: AuthSession<AuthInfo>) => Promise<RefreshTookHandlerResult<AuthInfo>>;
    action: (props?: { forceUpdate?: boolean }) => Promise<void>;
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
    async function refreshToken(retrievedAuthSession?: AuthSession<AuthInfo>, failureCount = 0) {
        const instance = getInstance<AuthInfo>(instanceId);

        if (!retrievedAuthSession && instance.state.session.status !== 'authenticated') {
            throw new BearAuthError(
                'bear-auth/not-authenticated',
                `Can't refresh access token. No auth sesssion active.`,
            );
        }

        setRefreshingSession<AuthInfo>(instance.state);

        await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

        stopTokenAutoRefresh<AuthInfo>(instanceId);

        try {
            instance.logger.debug('[refreshToken]', 'Refreshing access token...');

            await instance.continueWhenOnline();

            const { session } = instance.state;
            const authSession = retrievedAuthSession ?? (session.data as AuthSession<AuthInfo>);

            const result = await handler(authSession);

            instance.logger.debug('[refreshToken]', 'Received refresh access token result:', result);

            updateSessionAfterRefreshToken<AuthInfo>(instance.state, result);

            if (!retrievedAuthSession) {
                await persistAuthSession<AuthInfo>(instanceId);
            }

            startTokenAutoRefresh<AuthInfo>(instanceId);

            instance.logger.debug('[refreshToken]', 'Access token has been successfully refreshed.');

            await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

            return instance.state.session;
        } catch (error) {
            instance.logger.error(error);

            failureCount++;

            if ((await resolveRetry(options?.retry, error, failureCount)) && failureCount < MAX_RETRY_COUNT) {
                return refreshToken(retrievedAuthSession, failureCount);
            } else {
                setUnauthenticatedSession<AuthInfo>(instance.state);

                await instance.storage?.clear(instance.id);

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
            await refreshToken();
        }
    };

    return triggerRefreshToken;
}
