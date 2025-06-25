import { type BearAuth } from './create.ts';
import { getInstance } from './instances.ts';

export type OnAuthStateChangedCallback<AuthInfo> = (
    session: BearAuth<AuthInfo>['state']['session'],
) => Promise<void> | void;

/**
 * Register a callback to be called whenever the auth state changes.
 * @param id - return value of `create` method
 * @param callback - function to be called when the auth state changes
 * @returns a function to unsubscribe the callback
 */
export function onAuthStateChanged<AuthInfo>(
    id: BearAuth<AuthInfo>['id'],
    callback: OnAuthStateChangedCallback<AuthInfo>,
) {
    const instance = getInstance<AuthInfo>(id);

    instance.logger.debug('[onAuthStateChanged]', 'Subscribing...', callback);

    instance.onAuthStateChanged.add(callback);

    callback(instance.state.session);

    instance.logger.debug(
        '[onAuthStateChanged]',
        'Callback called immediately with current session:',
        instance.state.session,
    );

    return function unsubscribe() {
        instance.logger.debug('[onAuthStateChanged]', 'Unsubscribing...', callback);
        instance.onAuthStateChanged.delete(callback);
    };
}

export async function runOnAuthStateChangedCallbacks<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const instance = getInstance<AuthInfo>(id);
    const tasks = Array.from(instance.onAuthStateChanged.values()).map(callback => callback(instance.state.session));

    instance.logger.debug('[onAuthStateChanged]', 'All callbacks called with session:', instance.state.session);

    await Promise.allSettled(tasks);
}
