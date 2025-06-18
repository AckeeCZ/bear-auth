import { isExpired, startTokenAutoRefresh } from '~/autoRefreshToken';
import { type BearAuth } from '~/create';
import { destroy } from '~/destroy';
import { BearAuthError, isBearAuthError } from '~/errors';
import { clearStorageOnStorageVersionUpdate, persistAuthSession } from '~/storage';
import {
    setAuthenticatedSession,
    setUnauthenticatedSession,
    type AuthenticatedSession,
    type RefreshingSession,
} from '~/store/session';

import { getInstance } from './instances';
import { runOnAuthStateChangedCallbacks } from './onAuthStateChanged';

/**
 * - Attempts to retrieve the auth session from the storage.
 * - If refresh token isn't available but the access token is valid, it sets the session as authenticated.
 * - Refreshes the access token if it's expired, refresh token and the refreshToken hook are available.
 * - Refetches the auth info if it's available.
 * - Persists the fresh session in the storage.
 * - Calls `onAuthStateChanged` callbacks.
 * - If any of the above steps fail, destroys the instance.
 * - Returns the session object on success.
 * @param id - return value of `create` method
 * @returns - Session object
 */
export async function retrieveAuthSession<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const instance = getInstance<AuthInfo>(id);

    instance.logger.debug('[retrieveAuthSession]', 'Retrieving auth session...');

    await instance.continueWhenOnline();

    await clearStorageOnStorageVersionUpdate(id);

    const persistedSession = await instance.storage?.get(id);

    instance.logger.debug('[retrieveAuthSession]', { persistedSession });

    const unknownSession = persistedSession?.data;

    // The session might not have a refresh token but it might be valid.
    if (!unknownSession || !unknownSession.expiration) {
        await instance.storage?.clear(id);

        setUnauthenticatedSession(id);

        await runOnAuthStateChangedCallbacks<AuthInfo>(id);

        instance.logger.debug('[retrieveAuthSession]', 'No auth session retrieved.');

        return getInstance<AuthInfo>(id).state.session;
    }

    try {
        const authSession = unknownSession;

        instance.flags.autoRefreshAccessTokenEnabled = Boolean(authSession.expiration && authSession.refreshToken);

        setAuthenticatedSession(id, authSession);

        if (isExpired(authSession.expiration)) {
            if (instance.hooks.refreshToken) {
                await instance.hooks.refreshToken(authSession as RefreshingSession<AuthInfo>['data']);
            }
        } else {
            startTokenAutoRefresh(id);
        }

        if (authSession.authInfo && instance.hooks.fetchAuthInfo) {
            const session = getInstance<AuthInfo>(id).state.session.data! as AuthenticatedSession<AuthInfo>['data'];

            await instance.hooks.fetchAuthInfo?.(session);
        }

        await persistAuthSession<AuthInfo>(id);

        await runOnAuthStateChangedCallbacks<AuthInfo>(id);

        instance.logger.debug('[retrieveAuthSession]', 'Auth session successfully retrieved.');

        return getInstance<AuthInfo>(id).state.session;
    } catch (error) {
        instance.logger.error(error);

        if (isBearAuthError(error)) {
            throw error;
        } else {
            await destroy<AuthInfo>(id);

            throw new BearAuthError('bear-auth/retrieve-auth-session-failed', 'Failed to retrieve auth session', error);
        }
    }
}
