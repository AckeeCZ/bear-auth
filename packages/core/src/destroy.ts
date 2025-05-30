import { stopTokenAutoRefresh } from '~/autoRefreshToken';
import { type BearAuth } from '~/create';
import { setUnauthenticatedSession } from '~/store/session';

import { getInstance, instances } from './instances';
import { runOnAuthStateChangedCallbacks } from './onAuthStateChanged';

/**
 * Destroys the BearAuth instance.
 * - Tries to logout user.
 * - Clears the storage.
 * - Deletes the instance.
 * @param instanceId - return value of `create` method
 */
export async function destroy<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    const instance = getInstance<AuthInfo>(instanceId);

    if (!instance) {
        return;
    }

    stopTokenAutoRefresh<AuthInfo>(instanceId);

    instance.logger.debug('[destroy]', 'Destroying auth session.');

    if (instance.hooks.logout) {
        await instance.hooks.logout();
    } else {
        await instance.storage?.clear(instanceId);

        setUnauthenticatedSession(instanceId);

        await runOnAuthStateChangedCallbacks<AuthInfo>(instanceId);
    }

    const keys = Object.keys(instance) as (keyof BearAuth<AuthInfo>)[];

    for (const key of keys) {
        delete instance[key];
    }

    instances.delete(instanceId);
}
