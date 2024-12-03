import { stopTokenAutoRefresh } from '~/autoRefreshToken';
import { getInstance, setInstance, type BearAuth } from '~/create';
import { BearAuthError } from '~/errors';
import { runOnAuthStateChangedCallbacks } from '~/onAuthStateChanged';
import { setUnauthenticatedSession } from '~/store/session';
import type { AuthSession } from '~/types';

export type LogoutHook<AuthInfo> = {
    handler: (authSession: AuthSession<AuthInfo>) => Promise<void>;
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
): AuthHook['action'] {
    async function logout() {
        let instance = getInstance<AuthInfo>(instanceId);

        const { session } = instance.state;

        if (session.status !== 'authenticated') {
            throw new BearAuthError('bear-auth/not-authenticated', `Can't logout. No auth sesssion active.`);
        }

        try {
            instance.logger.debug('Sign-out...');

            instance = stopTokenAutoRefresh(instance);

            await instance.continueWhenOnline();

            await handler(session.data);

            instance.state = setUnauthenticatedSession(instance.state);

            await instance.storage?.clear(instance.id);

            setInstance(instance);

            instance.logger.debug('Signed out.');

            await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);
        } catch (error) {
            instance.logger.error(error);

            throw new BearAuthError('bear-auth/logout-failed', 'Failed to logout.', error);
        }
    }

    const instance = getInstance<AuthInfo>(instanceId);

    instance.hooks.logout = logout;

    setInstance(instance);

    return logout;
}
