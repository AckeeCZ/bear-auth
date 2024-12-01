import { getInstance, setInstance, type BearAuth } from '~/create';

export type OnAuthStateChangedCallback<AuthInfo> = (
    session: BearAuth<AuthInfo>['state']['session'],
) => Promise<void> | void;

export function onAuthStateChanged<AuthInfo>(
    instanceId: BearAuth<AuthInfo>['id'],
    callback: OnAuthStateChangedCallback<AuthInfo>,
) {
    const instance = getInstance<AuthInfo>(instanceId);

    instance.logger.debug('onAuthStateChanged', 'Subscribing...', callback);

    instance.onAuthStateChanged.add(callback);

    setInstance(instance);

    callback(instance.state.session);

    return function unsubscribe() {
        instance.logger.debug('onAuthStateChanged', 'Unsubscribing...', callback);
        instance.onAuthStateChanged.delete(callback);
    };
}

export async function runOnAuthStateChangedCallbacks<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    const instance = getInstance<AuthInfo>(instanceId);
    const tasks = Array.from(instance.onAuthStateChanged.values()).map(callback => callback(instance.state.session));

    await Promise.allSettled(tasks);
}
