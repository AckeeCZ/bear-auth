import { stopTokenAutoRefresh } from './autoRefreshToken.ts';
import { type BearAuth } from './create.ts';
import { getInstance, instances } from './instances.ts';
import { runOnAuthStateChangedCallbacks } from './onAuthStateChanged.ts';
import { setUnauthenticatedSession } from './store/session.ts';

/**
 * Destroys the BearAuth instance.
 * - Tries to logout user.
 * - Clears the storage.
 * - Deletes the instance.
 * @param id - return value of `create` method
 */
export async function destroy<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const instance = getInstance<AuthInfo>(id);

    if (!instance) {
        return;
    }

    stopTokenAutoRefresh<AuthInfo>(id);

    instance.logger.debug('[destroy]', 'Destroying auth session.');

    instance.authSessionPropagation?.cleanUp();

    if (instance.hooks.logout) {
        await instance.hooks.logout();
    } else {
        await instance.storage?.clear(id);

        setUnauthenticatedSession(id);

        await runOnAuthStateChangedCallbacks<AuthInfo>(id);
    }

    const keys = Object.keys(instance) as (keyof BearAuth<AuthInfo>)[];

    for (const key of keys) {
        delete instance[key];
    }

    instances.delete(id);
}
