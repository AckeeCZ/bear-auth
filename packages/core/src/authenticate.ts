import { convertExpiresInToExpiration, startTokenAutoRefresh } from '~/autoRefreshToken';
import { getInstance, setInstance, type BearAuth } from '~/create';
import { BearAuthError } from '~/errors';
import { persistAuthSession } from '~/storage';
import { setAuthenticatedSession } from '~/store/session';

import { runOnAuthStateChangedCallbacks } from './onAuthStateChanged';

export type AuthenticateProps<AuthInfo> = {
    /**
     * Access token
     */
    accessToken: string;

    /**
     * Auth data (e.g. user info)
     */
    authInfo?: AuthInfo | null;

    /**
     * Expiration time in seconds. Minimal values is }
     *
     */
    expiresIn?: number | null;

    /**
     * Refresh token
     */
    refreshToken?: string | null;
};

/**
 * Once user signs-in / signs-up, this method is called to pass the authentication data to the library.
 * - Only `accessToken` is required to be returned.
 * - `expiresIn` and `refreshToken` are optional, but if provided, the library will automatically refresh the access token when it expires.
 * - Don't forget to `setRefreshTokenHook` before calling this method if you want to use the refresh token.
 * - Similarly, don't forget to `setFetchAuthInfo` before calling this method if you want to use the `authInfo` property.
 * @param instanceId - return value of `create` method
 * @param props - authentication data
 */
export async function authenticate<AuthInfo>(
    instanceId: BearAuth<AuthInfo>['id'],
    { accessToken, expiresIn = null, refreshToken = null, authInfo = null }: AuthenticateProps<AuthInfo>,
) {
    let instance = getInstance<AuthInfo>(instanceId);

    const refreshTokenHookRequired = Boolean(refreshToken);
    const fetchAuthInfoHookRequired = Boolean(authInfo);

    instance.flags.autoRefreshAccessTokenEnabled = Boolean(refreshTokenHookRequired && expiresIn);

    if (refreshTokenHookRequired && !instance.hooks.refreshToken) {
        throw new BearAuthError(
            'bear-auth/unset-hook',
            `The 'refreshToken' property provided but the refresh token hook has not been set yet. Call setRefreshTokenHook(...) first.`,
        );
    }

    if (fetchAuthInfoHookRequired && !instance.hooks.fetchAuthInfo) {
        throw new BearAuthError(
            'bear-auth/unset-hook',
            `The 'authInfo' property provided but the fetch authenticated data hook has not been set yet. Call setFetchAuthInfo(...) first.`,
        );
    }

    const expiration = expiresIn ? convertExpiresInToExpiration(expiresIn * 1000) : null;

    instance.state = setAuthenticatedSession<AuthInfo>(instance.state, {
        accessToken,
        expiration,
        refreshToken,
        authInfo,
    });

    await persistAuthSession<AuthInfo>(instance);

    instance = startTokenAutoRefresh<AuthInfo>(instance);

    setInstance<AuthInfo>(instance);

    await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

    return instance.state.session;
}
