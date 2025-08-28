import { startTokenAutoRefresh } from './autoRefreshToken.ts';
import { type BearAuth } from './create.ts';
import { BearAuthError } from './errors.ts';
import { getExpirationTimestampWithBuffer } from './expiration.ts';
import { getInstance } from './instances.ts';
import { runOnAuthStateChangedCallbacks } from './onAuthStateChanged.ts';
import { persistAuthSession } from './storage.ts';
import { setAuthenticatedSession } from './store/session.ts';
import { registerTask } from './tasks.ts';

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
     * Expiration timestamp in ISO format.
     */
    expiration?: string | null;

    /**
     * Refresh token
     */
    refreshToken?: string | null;
};

export async function authenticateInner<AuthInfo>(
    id: BearAuth<AuthInfo>['id'],
    { accessToken, expiration = null, refreshToken = null, authInfo = null }: AuthenticateProps<AuthInfo>,
) {
    const { hooks, store } = getInstance<AuthInfo>(id);

    const refreshTokenHookRequired = Boolean(refreshToken);
    const fetchAuthInfoHookRequired = Boolean(authInfo);

    getInstance<AuthInfo>(id).flags.autoRefreshAccessTokenEnabled = Boolean(refreshTokenHookRequired && expiration);

    if (refreshTokenHookRequired && !hooks.refreshToken) {
        throw new BearAuthError(
            'bear-auth/unset-hook',
            `The 'refreshToken' property provided but the refresh token hook has not been set yet. Call setRefreshTokenHook(...) first.`,
        );
    }

    if (fetchAuthInfoHookRequired && !hooks.fetchAuthInfo) {
        throw new BearAuthError(
            'bear-auth/unset-hook',
            `The 'authInfo' property provided but the fetch authenticated data hook has not been set yet. Call setFetchAuthInfo(...) first.`,
        );
    }

    await store.setSession(() =>
        setAuthenticatedSession({
            accessToken,
            expiration: getExpirationTimestampWithBuffer(expiration),
            refreshToken,
            authInfo,
        }),
    );

    await persistAuthSession<AuthInfo>(id, store.getSession().data);

    await startTokenAutoRefresh(id);

    await runOnAuthStateChangedCallbacks<AuthInfo>(id);

    return store.getSession();
}

/**
 * Once user signs-in / signs-up, this method is called to pass the authentication data to the library.
 * - Only `accessToken` is required to be returned.
 * - `expiration` and `refreshToken` are optional, but if provided, the library will automatically refresh the access token when it expires.
 * - Don't forget to `setRefreshTokenHook` before calling this method if you want to use the refresh token.
 * - Similarly, don't forget to `setFetchAuthInfo` before calling this method if you want to use the `authInfo` property.
 * @param id - return value of `create` method
 * @param props - authentication data
 */
export function authenticate<AuthInfo>(id: BearAuth<AuthInfo>['id'], props: AuthenticateProps<AuthInfo>) {
    return registerTask<AuthInfo, 'authenticate', typeof authenticateInner<AuthInfo>>(
        id,
        'authenticate',
        authenticateInner,
    )(id, props);
}
