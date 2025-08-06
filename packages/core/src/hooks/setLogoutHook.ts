import { stopTokenAutoRefresh } from '../autoRefreshToken.ts';
import { type BearAuth } from '../create.ts';
import { BearAuthError } from '../errors.ts';
import { getInstance } from '../instances.ts';
import { runOnAuthStateChangedCallbacks } from '../onAuthStateChanged.ts';
import {
    setSigningOutSession,
    setUnauthenticatedSession,
    type AuthenticatedSession,
    type SigningOutSession,
} from '../store/session.ts';
import { registerTask } from '../tasks.ts';
import { MAX_RETRY_COUNT, resolveRetry, type Retry } from './utils/retry.ts';

type AuthData<AuthInfo> = AuthenticatedSession<AuthInfo>['data'];

export type LogoutHook<AuthInfo> = {
    handler: (authSession: AuthData<AuthInfo>) => Promise<void>;
    action: () => Promise<void>;
};

/**
 * - Set a function to make API call to your app's backend and signs-out the user.
 * - It's always required.
 * @param id - return value of `create` method
 * @param handler - function to logout the user
 * @returns - trigger the logout process
 */
export function setLogoutHook<AuthInfo, AuthHook extends LogoutHook<AuthInfo> = LogoutHook<AuthInfo>>(
    id: BearAuth<AuthInfo>['id'],
    handler: AuthHook['handler'],
    options?: {
        retry: Retry;
    },
): AuthHook['action'] {
    async function logout(failureCount = 0) {
        const { continueWhenOnline, logger, store, storage } = getInstance<AuthInfo>(id);

        if (store.getSession().status !== 'authenticated') {
            return;
        }

        await store.setSession(setSigningOutSession);

        await runOnAuthStateChangedCallbacks<AuthInfo>(id);

        try {
            logger.debug('[logout]', 'Signing-out...');

            await stopTokenAutoRefresh<AuthInfo>(id);

            await continueWhenOnline('logout');

            await handler(store.getSession().data as SigningOutSession<AuthInfo>['data']);

            logger.debug('[logout]', 'Signed out.');
        } catch (error) {
            logger.error(error);

            failureCount++;

            if ((await resolveRetry(options?.retry, error, failureCount)) && failureCount < MAX_RETRY_COUNT) {
                return logout(failureCount);
            } else {
                throw new BearAuthError('bear-auth/logout-failed', 'Failed to logout.', error);
            }
        } finally {
            await store.setSession(setUnauthenticatedSession);

            await storage?.clear(id);

            await runOnAuthStateChangedCallbacks<AuthInfo>(id);
        }
    }

    getInstance<AuthInfo>(id).hooks.logout = logout;

    return registerTask<AuthInfo, 'logout', AuthHook['action']>(id, 'logout', logout);
}
