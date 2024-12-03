import { isExpired, startTokenAutoRefresh } from '~/autoRefreshToken';
import { getInstance, setInstance, type BearAuth } from '~/create';
import { destroy } from '~/destroy';
import { BearAuthError, isBearAuthError } from '~/errors';
import { clearStorageOnStorageVersionUpdate, persistAuthSession } from '~/storage';
import { setAuthenticatedSession, setUnauthenticatedSession } from '~/store/session';

import { runOnAuthStateChangedCallbacks } from './onAuthStateChanged';

/**
 * - Attempts to retrieve the auth session from the storage.
 * - Refreshes the access token if it's expired and refresh token is available.
 * - Refetches the auth info if it's available.
 * - Persists the fresh session in the storage.
 * - Calls `onAuthStateChanged` callbacks.
 * - If any of the above steps fail, destroys the instance.
 * - Returns the session object on success.
 * @param instanceId - return value of `create` method
 * @returns - Session object
 */
export async function retrieveAuthSession<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    let instance = getInstance<AuthInfo>(instanceId);

    instance.logger.debug('retrieveAuthSession', 'Retrieving auth session...');

    await instance.continueWhenOnline();

    await clearStorageOnStorageVersionUpdate(instance);

    const session = await instance.storage?.get(instance.id);

    instance.logger.debug('retrieveAuthSession', session);

    if (!session?.data || !session.data.expiration || !session.data.refreshToken) {
        instance.state = setUnauthenticatedSession(instance.state);

        setInstance(instance);

        await instance.storage?.clear(instance.id);

        await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

        instance.logger.debug('No auth session retrieved.');

        return instance.state.session;
    }

    try {
        const authSession = session.data;

        instance.flags.autoRefreshAccessTokenEnabled = Boolean(authSession.expiration && authSession.refreshToken);

        instance.state = setAuthenticatedSession(instance.state, authSession);

        if (isExpired(authSession.expiration) && instance.hooks.refreshToken) {
            instance = await instance.hooks.refreshToken(authSession);
        } else {
            instance = startTokenAutoRefresh(instance);
        }

        if (authSession.authInfo && instance.hooks.fetchAuthInfo) {
            instance = await instance.hooks.fetchAuthInfo(authSession);
        }

        await persistAuthSession<AuthInfo>(instance);

        setInstance(instance);

        await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

        instance.logger.debug('Auth session successfully retrieved.');

        return instance.state.session;
    } catch (error) {
        instance.logger.error(error);

        if (isBearAuthError(error)) {
            throw error;
        } else {
            await destroy<AuthInfo>(instance.id);

            throw new BearAuthError('bear-auth/retrieve-auth-session-failed', 'Failed to retrieve auth session', error);
        }
    }
}
