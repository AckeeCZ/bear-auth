import { stopTokenAutoRefresh } from '../autoRefreshToken.ts';
import { type BearAuth } from '../create.ts';
import { BearAuthError } from '../errors.ts';
import { getInstance } from '../instances.ts';
import { runOnAuthStateChangedCallbacks } from '../onAuthStateChanged.ts';
import { persistAuthSession } from '../storage.ts';
import {
    setAuthenticatedSession,
    setUnauthenticatedSession,
    type AuthenticatedSession,
    type Session,
} from '../store/session.ts';
import { registerTask } from '../tasks.ts';
import { MAX_RETRY_COUNT, resolveRetry, type Retry } from './utils/retry.ts';

export type FetchAuthInfoHook<AuthInfo> = {
    handler: (authSession: AuthenticatedSession<AuthInfo>['data']) => Promise<AuthInfo>;
    action: () => Promise<Session<AuthInfo>>;
};

export type AuthData<AuthInfo> = AuthenticatedSession<AuthInfo>['data'];

/**
 * - During configuration of BearAuth, set a function to fetch the auth info from your API.
 * - Required when the `authenticaion` method returns `authInfo`.
 * @param id - return value of `create` method
 * @param handler - function to fetch the auth info
 * @returns - function to refetch the auth info
 */
export function setFetchAuthInfoHook<
    AuthInfo,
    AuthHook extends FetchAuthInfoHook<AuthInfo> = FetchAuthInfoHook<AuthInfo>,
>(
    id: BearAuth<AuthInfo>['id'],
    handler: AuthHook['handler'],
    options?: {
        retry: Retry;
    },
): AuthHook['action'] {
    async function fetchAuthInfo(retrievedAuthSession?: AuthData<AuthInfo>, failureCount = 0) {
        const { logger, store, storage, continueWhenOnline } = getInstance<AuthInfo>(id);

        if (!retrievedAuthSession && store.getSession().status !== 'authenticated') {
            throw new BearAuthError('bear-auth/not-authenticated', `Can't fetch auth data. No auth sesssion active.`);
        }

        try {
            const authSession = retrievedAuthSession ?? (store.getSession().data as AuthData<AuthInfo>);

            logger.debug('[fetchAuthInfo]', 'Fetching auth data...', authSession);

            await continueWhenOnline('fetchAuthInfo');

            const authInfo = await handler(authSession);

            await store.setSession(() =>
                setAuthenticatedSession({
                    ...authSession,
                    authInfo,
                }),
            );

            await persistAuthSession<AuthInfo>(id);

            logger.debug('[fetchAuthInfo]', 'Auth data has been fetched:', authInfo);

            return store.getSession();
        } catch (error) {
            logger.error(error);

            failureCount++;

            if ((await resolveRetry(options?.retry, error, failureCount)) && failureCount < MAX_RETRY_COUNT) {
                return fetchAuthInfo(retrievedAuthSession, failureCount);
            } else {
                stopTokenAutoRefresh<AuthInfo>(id);

                await store.setSession(setUnauthenticatedSession);

                await storage?.clear(id);

                await runOnAuthStateChangedCallbacks<AuthInfo>(id);

                throw new BearAuthError('bear-auth/fetch-auth-data-failed', 'Failed to fetch auth data.', error);
            }
        }
    }

    getInstance<AuthInfo>(id).hooks.fetchAuthInfo = fetchAuthInfo;

    async function refreshAuthInfo() {
        return await fetchAuthInfo();
    }

    return registerTask<AuthInfo, 'fetchAuthInfo', AuthHook['action']>(id, 'fetchAuthInfo', refreshAuthInfo);
}
