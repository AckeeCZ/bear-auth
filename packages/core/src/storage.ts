import { type BearAuth } from './create.ts';
import { BearAuthError, isBearAuthError } from './errors.ts';
import { getInstance } from './instances.ts';
import type { SessionData } from './store/session.ts';

export type PersistedData<AuthInfo> = {
    version: number;
    data: SessionData<AuthInfo>;
};

/**
 * Storage schema to persist the auth session.
 */
export type StorageSchema<AuthInfo> = {
    /**
     * Version of `AuthInfo` schema. Increment this value when `AuthInfo` schema is updated, the storage will be cleared.
     */
    version: number;
    set: (id: string, data: PersistedData<AuthInfo>) => Promise<void>;
    get: (id: string) => Promise<PersistedData<AuthInfo> | undefined>;
    remove: (id: string) => Promise<void>;
    clear: (id: string) => Promise<void>;
};

/**
 * Set the custom storage to persist the auth session.
 * @param id - return value of `create` method
 * @param storage
 */
export function setStorage<AuthInfo>(id: BearAuth<AuthInfo>['id'], storage: StorageSchema<AuthInfo>) {
    const instance = getInstance<AuthInfo>(id);

    instance.storage = storage;
}

/**
 * Once internal storage version is updated or storage schema version is updated, clear storage.
 */
export async function clearStorageOnStorageVersionUpdate<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const { storage, storageVersion, logger } = getInstance<AuthInfo>(id);

    if (!storage) {
        return;
    }

    try {
        const currentVersion = storage.version + storageVersion;
        const persistedData = await storage.get(id);

        if (persistedData && persistedData.version !== currentVersion) {
            logger.debug(
                '[clearStorageOnStorageVersionUpdate]',
                'Storage version has been updated. Clearing storage...',
            );
            await storage.clear(id);
        }
    } catch (error) {
        if (isBearAuthError(error) || !(error instanceof Error)) {
            logger.error(error);
        } else {
            logger.error(new BearAuthError('bear-auth/retrieve-auth-session-failed', error.message, error));
        }

        await storage.clear(id);
    }
}

/**
 * Attempt to use the storage to persist the auth session from `instance.state`.
 */
export async function persistAuthSession<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const instance = getInstance<AuthInfo>(id);

    if (!instance.storage) {
        return false;
    }

    const session = instance.state.session;

    if (session.status !== 'authenticated') {
        throw new BearAuthError('bear-auth/not-authenticated', `Can't persist auth session. No auth sesssion active.`);
    }

    await instance.storage.set(id, {
        version: instance.storage.version + instance.storageVersion,
        data: session.data,
    });

    return true;
}
