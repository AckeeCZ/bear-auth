import { isExpired, startTokenAutoRefresh, stopTokenAutoRefresh, validateExpiresIn } from '~/autoRefreshToken';
import { type BearAuth } from '~/create';
import { BearAuthError } from '~/errors';
import { getInstance, setInstance } from '~/instances';
import { runOnAuthStateChangedCallbacks } from '~/onAuthStateChanged';
import { persistAuthSession } from '~/storage';
import { setUnauthenticatedSession, updateSessionAfterRefreshToken } from '~/store/session';
import type { AuthSession } from '~/types';

export type RefreshTookHandlerResult<AuthInfo> = {
    accessToken: string;
    refreshToken: string;
    expiresIn?: number | null;
    authInfo?: AuthInfo | null;
};

export type RefreshTokenHook<AuthInfo> = {
    handler: (authSession: AuthSession<AuthInfo>) => Promise<RefreshTookHandlerResult<AuthInfo>>;
    action: (props?: { forceUpdate?: boolean }) => Promise<void>;
};

/**
 * - Set a function to make API call to your app's backend and fetch fresh access token.
 * - Required when the `authenticaion` method returns `refreshToken` & `expiresIn` properties.
 * @param instanceId - return value of `create` method
 * @param handler - function to refresh the access token
 * @returns
 */
export function setRefreshTokenHook<AuthInfo, AuthHook extends RefreshTokenHook<AuthInfo> = RefreshTokenHook<AuthInfo>>(
    instanceId: BearAuth<AuthInfo>['id'],
    handler: AuthHook['handler'],
): AuthHook['action'] {
    async function refreshToken(retrievedAuthSession?: AuthSession<AuthInfo>) {
        let instance = getInstance<AuthInfo>(instanceId);

        if (!retrievedAuthSession && instance.state.session.status !== 'authenticated') {
            throw new BearAuthError(
                'bear-auth/not-authenticated',
                `Can't refresh access token. No auth sesssion active.`,
            );
        }

        instance = stopTokenAutoRefresh(instance);

        try {
            instance.logger.debug('Refreshing access token...');

            await instance.continueWhenOnline();

            instance = getInstance<AuthInfo>(instanceId);
            const { session } = instance.state;
            const authSession = retrievedAuthSession ?? (session.data as AuthSession<AuthInfo>);

            const result = await handler(authSession);

            instance.logger.debug('Received refresh access token result:', result);

            validateExpiresIn(result.expiresIn ? result.expiresIn * 1000 : 0);

            instance.state = updateSessionAfterRefreshToken(instance.state, result);

            if (!retrievedAuthSession) {
                await persistAuthSession<AuthInfo>(instance);
            }

            instance = startTokenAutoRefresh(instance);

            instance.logger.debug('Access token has been successfully refreshed.');

            return instance;
        } catch (error) {
            instance.logger.error(error);

            instance.state = setUnauthenticatedSession(instance.state);

            await instance.storage?.clear(instance.id);

            setInstance(instance);

            await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

            throw new BearAuthError('bear-auth/refresh-token-failed', 'Failed to refresh access token', error);
        }
    }

    const instance = getInstance<AuthInfo>(instanceId);

    instance.hooks.refreshToken = refreshToken;

    setInstance(instance);

    const triggerRefreshToken: AuthHook['action'] = async options => {
        const instance = getInstance<AuthInfo>(instanceId);

        if (options?.forceUpdate || isExpired(instance.state.session.data?.expiration)) {
            await refreshToken();
        }
    };

    return triggerRefreshToken;
}
