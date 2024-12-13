import { stopTokenAutoRefresh } from '~/autoRefreshToken';
import { type BearAuth } from '~/create';
import { BearAuthError } from '~/errors';
import { getInstance, setInstance } from '~/instances';
import { runOnAuthStateChangedCallbacks } from '~/onAuthStateChanged';
import { persistAuthSession } from '~/storage';
import { setUnauthenticatedSession, updateAuthInfo } from '~/store/session';
import type { AuthSession } from '~/types';

export type FetchAuthInfoHook<AuthInfo> = {
    handler: (authSession: AuthSession<AuthInfo>) => Promise<AuthInfo>;
    action: () => Promise<void>;
};

/**
 * - During configuration of BearAuth, set a function to fetch the auth info from your API.
 * - Required when the `authenticaion` method returns `authInfo`.
 * @param instanceId - return value of `create` method
 * @param handler - function to fetch the auth info
 * @returns - function to refetch the auth info
 */
export function setFetchAuthInfoHook<
    AuthInfo,
    AuthHook extends FetchAuthInfoHook<AuthInfo> = FetchAuthInfoHook<AuthInfo>,
>(instanceId: BearAuth<AuthInfo>['id'], handler: AuthHook['handler']): AuthHook['action'] {
    async function fetchAuthInfo(retrievedAuthSession?: AuthSession<AuthInfo>) {
        let instance = getInstance<AuthInfo>(instanceId);

        const { session } = instance.state;

        if (!retrievedAuthSession && session.status !== 'authenticated') {
            throw new BearAuthError('bear-auth/not-authenticated', `Can't fetch auth data. No auth sesssion active.`);
        }

        try {
            instance.logger.debug('Fetching auth data...');

            const authSession = retrievedAuthSession ?? (session.data as AuthSession<AuthInfo>);

            const authInfo = await handler(authSession);

            instance.state = updateAuthInfo(instance.state, authInfo);

            if (!retrievedAuthSession) {
                await persistAuthSession<AuthInfo>(instance);
            }

            instance.logger.debug('Auth data has been fetched:', authInfo);

            setInstance(instance);

            return instance;
        } catch (error) {
            instance.logger.error(error);

            instance = stopTokenAutoRefresh(instance);

            instance.state = setUnauthenticatedSession(instance.state);

            await instance.storage?.clear(instance.id);

            setInstance(instance);

            await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

            throw new BearAuthError('bear-auth/fetch-auth-data-failed', 'Failed to fetch auth data.', error);
        }
    }

    const instance = getInstance<AuthInfo>(instanceId);

    instance.hooks.fetchAuthInfo = fetchAuthInfo;

    setInstance(instance);

    async function refreshAuthInfo() {
        await fetchAuthInfo();
    }

    return refreshAuthInfo;
}
