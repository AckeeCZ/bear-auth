import { stopTokenAutoRefresh } from '~/autoRefreshToken';
import { type BearAuth } from '~/create';
import { BearAuthError } from '~/errors';
import { getInstance } from '~/instances';
import { runOnAuthStateChangedCallbacks } from '~/onAuthStateChanged';
import { setSigningOutSession, setUnauthenticatedSession, type AuthenticatedSession } from '~/store/session';

import { MAX_RETRY_COUNT, resolveRetry, type Retry } from './utils/retry';

type AuthData<AuthInfo> = AuthenticatedSession<AuthInfo>['data'];

export type LogoutHook<AuthInfo> = {
    handler: (authSession: AuthData<AuthInfo>) => Promise<void>;
    action: () => Promise<void>;
};

/**
 * - Set a function to make API call to your app's backend and signs-out the user.
 * - It's always required.
 * @param instanceId - return value of `create` method
 * @param handler - function to logout the user
 * @returns - trigger the logout process
 */
export function setLogoutHook<AuthInfo, AuthHook extends LogoutHook<AuthInfo> = LogoutHook<AuthInfo>>(
    instanceId: BearAuth<AuthInfo>['id'],
    handler: AuthHook['handler'],
    options?: {
        retry: Retry;
    },
): AuthHook['action'] {
    async function logout(failureCount = 0) {
        const instance = getInstance<AuthInfo>(instanceId);

        const { session } = instance.state;

        if (session.status !== 'authenticated') {
            throw new BearAuthError('bear-auth/not-authenticated', `Can't logout. No auth sesssion active.`);
        }

        setSigningOutSession<AuthInfo>(instance.state);

        await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);

        try {
            instance.logger.debug('[logout]', 'Sign-out...');

            stopTokenAutoRefresh<AuthInfo>(instanceId);

            await instance.continueWhenOnline();

            await handler(session.data);

            instance.logger.debug('[logout]', 'Signed out.');
        } catch (error) {
            instance.logger.error(error);

            failureCount++;

            if ((await resolveRetry(options?.retry, error, failureCount)) && failureCount < MAX_RETRY_COUNT) {
                return logout(failureCount);
            } else {
                throw new BearAuthError('bear-auth/logout-failed', 'Failed to logout.', error);
            }
        } finally {
            setUnauthenticatedSession<AuthInfo>(instance.state);

            await instance.storage?.clear(instance.id);

            await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);
        }
    }

    const instance = getInstance<AuthInfo>(instanceId);

    instance.hooks.logout = logout;

    return logout;
}
