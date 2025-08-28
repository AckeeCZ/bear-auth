import { isExpired, startTokenAutoRefresh } from './autoRefreshToken.ts';
import { type BearAuth } from './create.ts';
import { destroy } from './destroy.ts';
import { BearAuthError, isBearAuthError } from './errors.ts';
import { getInstance } from './instances.ts';
import { runOnAuthStateChangedCallbacks } from './onAuthStateChanged.ts';
import { clearStorageOnStorageVersionUpdate, persistAuthSession } from './storage.ts';
import {
    setAuthenticatedSession,
    setUnauthenticatedSession,
    type AuthenticatedSession,
    type RefreshingSession,
} from './store/session.ts';
import { registerTask } from './tasks.ts';

export async function retrieveAuthSessionInner<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const { store, storage, continueWhenOnline, logger, hooks } = getInstance<AuthInfo>(id);

    logger.debug('[retrieveAuthSession]', 'Retrieving auth session...');

    await continueWhenOnline('retrieveAuthSession');

    await clearStorageOnStorageVersionUpdate(id);

    const persistedSession = await storage?.get(id);

    logger.debug('[retrieveAuthSession]', { persistedSession });

    const unknownSession = persistedSession?.data;

    // The session might not have a refresh token but it might be valid.
    if (!unknownSession || !unknownSession.expiration) {
        await storage?.clear(id);

        await store.setSession(setUnauthenticatedSession);

        await runOnAuthStateChangedCallbacks<AuthInfo>(id);

        logger.debug('[retrieveAuthSession]', 'No auth session retrieved.');

        return store.getSession();
    }

    try {
        const authSession = unknownSession;

        getInstance(id).flags.autoRefreshAccessTokenEnabled = Boolean(
            authSession.expiration && authSession.refreshToken,
        );

        if (authSession.refreshToken && !hooks.refreshToken) {
            throw new BearAuthError(
                'bear-auth/unset-hook',
                `The 'refreshToken' property provided but the refresh token hook has not been set yet. Call setRefreshTokenHook(...) first.`,
            );
        }

        if (isExpired(authSession?.expiration) && hooks.refreshToken) {
            await hooks.refreshToken(authSession as RefreshingSession<AuthInfo>['data']);
        }

        if (authSession.authInfo && hooks.fetchAuthInfo) {
            await hooks.fetchAuthInfo?.({
                ...authSession,
                ...store.getSession().data,
            });
        }

        const resolvedAuthSession = {
            ...authSession,
            ...store.getSession().data,
        } satisfies AuthenticatedSession<AuthInfo>['data'];

        await persistAuthSession<AuthInfo>(id, resolvedAuthSession);

        store.setSession(() => setAuthenticatedSession(resolvedAuthSession));

        await startTokenAutoRefresh(id);

        await runOnAuthStateChangedCallbacks<AuthInfo>(id);

        logger.debug('[retrieveAuthSession]', 'Auth session successfully retrieved.');

        return store.getSession();
    } catch (error) {
        logger.error(error);

        if (isBearAuthError(error)) {
            throw error;
        } else {
            await destroy<AuthInfo>(id);

            throw new BearAuthError('bear-auth/retrieve-auth-session-failed', 'Failed to retrieve auth session', error);
        }
    }
}

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
export function retrieveAuthSession<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    return registerTask<AuthInfo, 'retrieveAuthSession', typeof retrieveAuthSessionInner>(
        id,
        'retrieveAuthSession',
        retrieveAuthSessionInner,
    )(id);
}
