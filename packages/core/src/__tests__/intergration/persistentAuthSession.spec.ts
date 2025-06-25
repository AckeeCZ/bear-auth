import { describe, expect, test, vi } from 'vitest';

import { create } from '../../create.ts';
import { destroy } from '../../destroy.ts';
import { getExpirationTimestampWithBuffer } from '../../expiration.ts';
import type { AuthData } from '../../hooks/setFetchAuthInfoHook.ts';
import { setRefreshTokenHook } from '../../hooks/setRefreshTokenHook.ts';
import { retrieveAuthSession } from '../../retrieveAuthSession.ts';
import { setStorage, type PersistedData } from '../../storage.ts';
import type { Session } from '../../store/session.ts';
import { getTestInstanceId } from '../utils/index.ts';

function createMockedStorage<AuthInfo>(id: string, persistedData: PersistedData<AuthInfo>, version: number = 1) {
    // Emulate a persisted session
    let persistedSession: Record<string, PersistedData<AuthInfo>> = {
        [id]: persistedData,
    };

    const setDataHandler = vi.fn(async (id: string, session) => {
        persistedSession[id] = session;
    });
    const getDataHandler = vi.fn(async (id: string) => persistedSession[id]);
    const clearDataHandler = vi.fn(async () => {
        persistedSession = {};
    });
    const removeDataHandler = vi.fn(async (id: string) => {
        if (persistedSession[id]) {
            delete persistedSession[id];
        }
    });

    return {
        remove: removeDataHandler,
        get: getDataHandler,
        set: setDataHandler,
        clear: clearDataHandler,
        version,
    };
}

describe('Persistent Authentication Session Flows', () => {
    test('should retrieve auth session with valid access token and clear storage on upgrade', async () => {
        const id = create({ id: getTestInstanceId() });

        const authInfo = { userId: 'user123' };
        type AuthInfo = typeof authInfo;
        const sessionData = {
            accessToken: 'test-access-token',
            authInfo,
            refreshToken: 'test-refresh-token',
            expiration: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
        };

        const storage = createMockedStorage<AuthInfo>(id, {
            data: sessionData,
            version: 2,
        });

        setStorage(id, storage);

        expect(await retrieveAuthSession(id)).toEqual({
            status: 'authenticated',
            data: sessionData,
        } satisfies Session<AuthInfo>);

        expect(storage.get).toHaveBeenCalled();

        const newStorage = createMockedStorage<AuthInfo>(id, { data: sessionData, version: 2 }, 2);

        // Update the storage version -> this simulates a migration
        setStorage(id, newStorage);

        expect(await retrieveAuthSession(id)).toEqual({
            status: 'unauthenticated',
            data: null,
        } satisfies Session<unknown>);

        expect(newStorage.clear).toHaveBeenCalled();

        await destroy(id);
    });

    test('should refresh expired access token during session retrieval', async () => {
        const id = create({ id: getTestInstanceId() });

        const authInfo = { userId: 'user123' };
        type AuthInfo = typeof authInfo;
        const sessionData = {
            accessToken: 'test-access-token',
            authInfo,
            refreshToken: 'test-refresh-token',
            expiration: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
        };
        const storage = createMockedStorage<AuthInfo>(id, {
            data: sessionData,
            version: 2,
        });
        setStorage(id, storage);

        const freshAccessToken = {
            accessToken: 'new-access-token',
            expiration: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
        };
        const refreshTokenHandler = vi.fn(async session => {
            return {
                ...session,
                ...freshAccessToken,
            } satisfies AuthData<AuthInfo>;
        });
        setRefreshTokenHook(id, refreshTokenHandler);

        expect(await retrieveAuthSession(id)).toEqual({
            status: 'authenticated',
            data: {
                ...sessionData,
                ...freshAccessToken,
                expiration: getExpirationTimestampWithBuffer(freshAccessToken.expiration),
            },
        } satisfies Session<AuthInfo>);

        expect(refreshTokenHandler).toHaveBeenCalledTimes(1);

        await destroy(id);
    });
});
