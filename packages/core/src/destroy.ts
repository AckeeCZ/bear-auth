import { stopTokenAutoRefresh } from './autoRefreshToken.ts';
import { type BearAuth } from './create.ts';
import { getInstance, instances } from './instances.ts';
import { runOnAuthStateChangedCallbacks } from './onAuthStateChanged.ts';
import { setUnauthenticatedSession } from './store/session.ts';
import { allTasksSettled, deleteInstanceTasks } from './tasks.ts';

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

    await stopTokenAutoRefresh<AuthInfo>(id);

    const { logger, authSessionPropagation, hooks, storage, store } = instance;

    logger.debug('[destroy]', 'Destroying auth session.');

    authSessionPropagation?.cleanUp();

    if (hooks.logout) {
        await hooks.logout();
    } else {
        await storage?.clear(id);

        await store.setSession(setUnauthenticatedSession);

        await runOnAuthStateChangedCallbacks<AuthInfo>(id);
    }

    instance.onAuthStateChanged.callbacks.clear();

    await allTasksSettled(id);
    deleteInstanceTasks(id);

    const keys = Object.keys(instance) as (keyof BearAuth<AuthInfo>)[];

    for (const key of keys) {
        delete instance[key];
    }

    instances.delete(id);
}
