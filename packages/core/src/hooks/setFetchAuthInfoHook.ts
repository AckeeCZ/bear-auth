import { stopTokenAutoRefresh } from '../autoRefreshToken.ts';
import { type BearAuth } from '../create.ts';
import { BearAuthError } from '../errors.ts';
import { getInstance } from '../instances.ts';
import { runOnAuthStateChangedCallbacks } from '../onAuthStateChanged.ts';
import { persistAuthSession } from '../storage.ts';
import { setUnauthenticatedSession, type AuthenticatedSession, type Session } from '../store/session.ts';
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
        const instance = getInstance<AuthInfo>(id);

        const { session } = instance.state;

        if (!retrievedAuthSession && session.status !== 'authenticated') {
            throw new BearAuthError('bear-auth/not-authenticated', `Can't fetch auth data. No auth sesssion active.`);
        }

        try {
            const authSession = retrievedAuthSession ?? (session.data as AuthData<AuthInfo>);

            instance.logger.debug('[fetchAuthInfo]', 'Fetching auth data...', authSession);

            const authInfo = await handler(authSession);

            session.data = {
                ...authSession,
                authInfo,
            };

            if (!retrievedAuthSession) {
                await persistAuthSession<AuthInfo>(id);
            }

            instance.logger.debug('[fetchAuthInfo]', 'Auth data has been fetched:', authInfo);

            return getInstance<AuthInfo>(id).state.session;
        } catch (error) {
            instance.logger.error(error);

            failureCount++;

            if ((await resolveRetry(options?.retry, error, failureCount)) && failureCount < MAX_RETRY_COUNT) {
                return fetchAuthInfo(retrievedAuthSession, failureCount);
            } else {
                stopTokenAutoRefresh<AuthInfo>(id);

                setUnauthenticatedSession<AuthInfo>(id);

                await instance.storage?.clear(id);

                await runOnAuthStateChangedCallbacks<AuthInfo>(id);

                throw new BearAuthError('bear-auth/fetch-auth-data-failed', 'Failed to fetch auth data.', error);
            }
        }
    }

    const instance = getInstance<AuthInfo>(id);

    instance.hooks.fetchAuthInfo = fetchAuthInfo;

    async function refreshAuthInfo() {
        return await fetchAuthInfo();
    }

    return refreshAuthInfo;
}
