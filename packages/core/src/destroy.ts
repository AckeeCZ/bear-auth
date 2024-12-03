import { stopTokenAutoRefresh } from '~/autoRefreshToken';
import { type BearAuth } from '~/create';
import { setUnauthenticatedSession } from '~/store/session';

import { getInstance, instances, setInstance } from './instances';
import { runOnAuthStateChangedCallbacks } from './onAuthStateChanged';

/**
 * Destroys the BearAuth instance.
 * - Tries to logout user.
 * - Clears the storage.
 * - Deletes the instance.
 * @param instanceId - return value of `create` method
 */
export async function destroy<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    let instance = getInstance<AuthInfo>(instanceId);

    if (!instance) {
        return;
    }

    instance = stopTokenAutoRefresh<AuthInfo>(instance);

    instance.logger.debug('destroy', 'Destroying auth session.');

    if (instance.hooks.logout) {
        await instance.hooks.logout();
    } else {
        await instance.storage?.clear(instance.id);

        instance.state = setUnauthenticatedSession(instance.state);

        setInstance(instance);

        await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);
    }

    const keys = Object.keys(instance) as (keyof BearAuth<AuthInfo>)[];

    for (const key of keys) {
        delete instance[key];
    }

    instances.delete(instanceId);
}
