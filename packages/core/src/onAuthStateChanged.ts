import { type BearAuth } from '~/create';

import { getInstance } from './instances';

export type OnAuthStateChangedCallback<AuthInfo> = (
    session: BearAuth<AuthInfo>['state']['session'],
) => Promise<void> | void;

/**
 * Register a callback to be called whenever the auth state changes.
 * @param instanceId - return value of `create` method
 * @param callback - function to be called when the auth state changes
 * @returns a function to unsubscribe the callback
 */
export function onAuthStateChanged<AuthInfo>(
    instanceId: BearAuth<AuthInfo>['id'],
    callback: OnAuthStateChangedCallback<AuthInfo>,
) {
    const instance = getInstance<AuthInfo>(instanceId);

    instance.logger.debug('[onAuthStateChanged]', 'Subscribing...', callback);

    instance.onAuthStateChanged.add(callback);

    callback(instance.state.session);

    return function unsubscribe() {
        instance.logger.debug('[onAuthStateChanged]', 'Unsubscribing...', callback);
        instance.onAuthStateChanged.delete(callback);
    };
}

export async function runOnAuthStateChangedCallbacks<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    const instance = getInstance<AuthInfo>(instanceId);
    const tasks = Array.from(instance.onAuthStateChanged.values()).map(callback => callback(instance.state.session));

    await Promise.allSettled(tasks);
}
