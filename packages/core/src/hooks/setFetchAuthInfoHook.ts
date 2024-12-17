import { stopTokenAutoRefresh } from '~/autoRefreshToken';
import { type BearAuth } from '~/create';
import { BearAuthError } from '~/errors';
import { getInstance } from '~/instances';
import { runOnAuthStateChangedCallbacks } from '~/onAuthStateChanged';
import { persistAuthSession } from '~/storage';
import { setUnauthenticatedSession, updateAuthInfo } from '~/store/session';
import type { AuthSession } from '~/types';

import { MAX_RETRY_COUNT, resolveRetry, type Retry } from './utils/retry';

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
>(
    instanceId: BearAuth<AuthInfo>['id'],
    handler: AuthHook['handler'],
    options?: {
        retry: Retry;
    },
): AuthHook['action'] {
    async function fetchAuthInfo(retrievedAuthSession?: AuthSession<AuthInfo>, failureCount = 0) {
        const instance = getInstance<AuthInfo>(instanceId);

        const { session } = instance.state;

        if (!retrievedAuthSession && session.status !== 'authenticated') {
            throw new BearAuthError('bear-auth/not-authenticated', `Can't fetch auth data. No auth sesssion active.`);
        }

        try {
            instance.logger.debug('[fetchAuthInfo]', 'Fetching auth data...');

            const authSession = retrievedAuthSession ?? (session.data as AuthSession<AuthInfo>);

            const authInfo = await handler(authSession);

            updateAuthInfo(instance.state, authInfo);

            if (!retrievedAuthSession) {
                await persistAuthSession<AuthInfo>(instanceId);
            }

            instance.logger.debug('[fetchAuthInfo]', 'Auth data has been fetched:', authInfo);

            return instance.state.session;
        } catch (error) {
            instance.logger.error(error);

            failureCount++;

            if ((await resolveRetry(options?.retry, error, failureCount)) && failureCount < MAX_RETRY_COUNT) {
                return fetchAuthInfo(retrievedAuthSession, failureCount);
            } else {
                stopTokenAutoRefresh(instanceId);

                setUnauthenticatedSession(instance.state);

                await instance.storage?.clear(instance.id);

                await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

                throw new BearAuthError('bear-auth/fetch-auth-data-failed', 'Failed to fetch auth data.', error);
            }
        }
    }

    const instance = getInstance<AuthInfo>(instanceId);

    instance.hooks.fetchAuthInfo = fetchAuthInfo;

    async function refreshAuthInfo() {
        await fetchAuthInfo();
    }

    return refreshAuthInfo;
}
