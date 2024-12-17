import { type BearAuth } from '~/create';
import { BearAuthError, isBearAuthError } from '~/errors';

import { getInstance } from './instances';
import type { SessionData } from './store/session';

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
    set: (instanceId: string, data: PersistedData<AuthInfo>) => Promise<void>;
    get: (instanceId: string) => Promise<PersistedData<AuthInfo> | undefined>;
    remove: (instanceId: string) => Promise<void>;
    clear: (instanceId: string) => Promise<void>;
};

/**
 * Set the custom storage to persist the auth session.
 * @param instanceId - return value of `create` method
 * @param storage
 */
export function setStorage<AuthInfo>(instanceId: BearAuth<AuthInfo>['id'], storage: StorageSchema<AuthInfo>) {
    const instance = getInstance<AuthInfo>(instanceId);

    instance.storage = storage;
}

/**
 * Once internal storage version is updated or storage schema version is updated, clear storage.
 */
export async function clearStorageOnStorageVersionUpdate<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    const { storage, storageVersion, logger } = getInstance<AuthInfo>(instanceId);

    if (!storage) {
        return;
    }

    try {
        const currentVersion = storage.version + storageVersion;
        const persistedData = await storage.get(instanceId);

        if (persistedData && persistedData.version !== currentVersion) {
            logger.debug(
                '[clearStorageOnStorageVersionUpdate]',
                'Storage version has been updated. Clearing storage...',
            );
            await storage.clear(instanceId);
        }
    } catch (error) {
        if (isBearAuthError(error) || !(error instanceof Error)) {
            logger.error(error);
        } else {
            logger.error(new BearAuthError('bear-auth/retrieve-auth-session-failed', error.message, error));
        }

        await storage.clear(instanceId);
    }
}

/**
 * Attempt to use the storage to persist the auth session from `instance.state`.
 */
export async function persistAuthSession<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    const instance = getInstance<AuthInfo>(instanceId);

    if (!instance.storage) {
        return false;
    }

    const session = instance.state.session;

    if (session.status !== 'authenticated') {
        throw new BearAuthError('bear-auth/not-authenticated', `Can't persist auth session. No auth sesssion active.`);
    }

    await instance.storage.set(instanceId, {
        version: instance.storage.version + instance.storageVersion,
        data: session.data,
    });

    return true;
}
