import { describe, expect, test, vi } from 'vitest';

import { authenticate } from '../../authenticate.ts';
import { create } from '../../create.ts';
import { destroy } from '../../destroy.ts';
import { getExpirationTimestampWithBuffer } from '../../expiration.ts';
import { setFetchAuthInfoHook, type AuthData } from '../../hooks/setFetchAuthInfoHook.ts';
import { setRefreshTokenHook } from '../../hooks/setRefreshTokenHook.ts';
import { setContinueWhenOnline } from '../../network.ts';
import { onAuthStateChanged } from '../../onAuthStateChanged.ts';
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

        const refreshedSessionData = {
            accessToken: 'new-access-token',
            refreshToken: 'test-refresh-token',
            expiration: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
        };

        const storage = createMockedStorage<AuthInfo>(id, {
            data: sessionData,
            version: 2,
        });

        setStorage(id, storage);

        const continueWhenOnline = vi.fn();
        setContinueWhenOnline(id, continueWhenOnline);

        setRefreshTokenHook(id, async () => refreshedSessionData);

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

        expect(continueWhenOnline).toHaveBeenCalledTimes(2);
        expect(continueWhenOnline).toHaveBeenCalledWith('retrieveAuthSession');

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

describe('Auth info across access token refreshes', () => {
    const authInfo = { userId: 'user123' };
    type AuthInfo = typeof authInfo;

    const hourFromNow = () => new Date(Date.now() + 3600 * 1000).toISOString();
    const hourAgo = () => new Date(Date.now() - 3600 * 1000).toISOString();

    const freshTokens = () => ({
        accessToken: 'new-access-token',
        refreshToken: 'test-refresh-token',
        expiration: hourFromNow(),
    });

    function setUpExpiredPersistedSession(persistedAuthInfo: AuthInfo | null = authInfo) {
        const id = create({ id: getTestInstanceId() });

        const storage = createMockedStorage<AuthInfo>(id, {
            data: {
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiration: hourAgo(),
                authInfo: persistedAuthInfo,
            },
            version: 2,
        });
        setStorage(id, storage);

        return { id, storage };
    }

    test('should keep the persisted authInfo in storage while auth info is refetched after a refresh during retrieval', async () => {
        const { id, storage } = setUpExpiredPersistedSession();

        setRefreshTokenHook<AuthInfo>(id, async () => freshTokens());

        let resolveAuthInfo: (value: AuthInfo) => void = () => {};
        const fetchAuthInfoHandler = vi.fn(() => new Promise<AuthInfo>(resolve => (resolveAuthInfo = resolve)));
        setFetchAuthInfoHook<AuthInfo>(id, fetchAuthInfoHandler);

        const retrieval = retrieveAuthSession(id);

        await vi.waitFor(() => expect(fetchAuthInfoHandler).toHaveBeenCalledTimes(1));

        // The tab may be closed right now, before the auth info request completes.
        expect((await storage.get(id))?.data?.authInfo).toEqual(authInfo);

        resolveAuthInfo(authInfo);

        expect((await retrieval).data?.authInfo).toEqual(authInfo);

        await destroy(id);
    });

    test('should notify subscribers with the persisted authInfo when refreshing during retrieval', async () => {
        const { id } = setUpExpiredPersistedSession();

        setRefreshTokenHook<AuthInfo>(id, async () => freshTokens());
        setFetchAuthInfoHook<AuthInfo>(id, async () => authInfo);

        const sessions: Session<AuthInfo>[] = [];
        onAuthStateChanged<AuthInfo>(id, session => {
            sessions.push(session);
        });

        await retrieveAuthSession(id);

        const notifiedSessions = sessions.filter(session => session.status !== 'retrieving');

        expect(notifiedSessions.map(session => session.status)).toContain('refreshing');
        expect(notifiedSessions.every(session => session.data?.authInfo?.userId === authInfo.userId)).toBe(true);

        await destroy(id);
    });

    test('should prefer authInfo returned by the refresh token handler', async () => {
        const { id } = setUpExpiredPersistedSession();

        const freshAuthInfo = { userId: 'fresh-user' };
        setRefreshTokenHook<AuthInfo>(id, async () => ({ ...freshTokens(), authInfo: freshAuthInfo }));

        expect((await retrieveAuthSession(id)).data?.authInfo).toEqual(freshAuthInfo);

        await destroy(id);
    });

    test('should fetch auth info during retrieval when the persisted session has none', async () => {
        const { id, storage } = setUpExpiredPersistedSession(null);

        setRefreshTokenHook<AuthInfo>(id, async () => freshTokens());

        const fetchAuthInfoHandler = vi.fn(async () => authInfo);
        setFetchAuthInfoHook<AuthInfo>(id, fetchAuthInfoHandler);

        expect((await retrieveAuthSession(id)).data?.authInfo).toEqual(authInfo);
        expect(fetchAuthInfoHandler).toHaveBeenCalledTimes(1);
        expect((await storage.get(id))?.data?.authInfo).toEqual(authInfo);

        await destroy(id);
    });

    test('should retrieve a session without auth info when the fetch auth info hook is not set', async () => {
        const { id } = setUpExpiredPersistedSession(null);

        setRefreshTokenHook<AuthInfo>(id, async () => freshTokens());

        const session = await retrieveAuthSession(id);

        expect(session.status).toBe('authenticated');
        expect(session.data?.authInfo).toBeNull();

        await destroy(id);
    });

    test('should keep authInfo when refreshing the access token of an active session', async () => {
        const id = create({ id: getTestInstanceId() });

        setFetchAuthInfoHook<AuthInfo>(id, async () => authInfo);
        const refresh = setRefreshTokenHook<AuthInfo>(id, async () => freshTokens());

        await authenticate<AuthInfo>(id, {
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            expiration: hourFromNow(),
            authInfo,
        });

        const session = await refresh({ forceRefresh: true });

        expect(session.data?.accessToken).toBe('new-access-token');
        expect(session.data?.authInfo).toEqual(authInfo);

        await destroy(id);
    });

    test('should retry a failed refresh of an active session', async () => {
        const id = create({ id: getTestInstanceId() });

        const refreshTokenHandler = vi
            .fn<() => Promise<AuthData<AuthInfo> & { expiration: string; refreshToken: string }>>()
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockImplementation(async () => freshTokens());
        const refresh = setRefreshTokenHook<AuthInfo>(id, refreshTokenHandler, { retry: () => true });

        await authenticate<AuthInfo>(id, {
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            expiration: hourFromNow(),
        });

        const session = await refresh({ forceRefresh: true });

        expect(refreshTokenHandler).toHaveBeenCalledTimes(2);
        expect(session).toMatchObject({ status: 'authenticated', data: { accessToken: 'new-access-token' } });

        await destroy(id);
    });

    test('should retry with the session delivered by another tab while the refresh was in flight', async () => {
        const id = create({ id: getTestInstanceId() });

        setFetchAuthInfoHook<AuthInfo>(id, async () => authInfo);

        let rejectFirstAttempt: (error: Error) => void = () => {};
        const refreshTokenHandler = vi
            .fn<
                (
                    session: AuthData<AuthInfo>,
                ) => Promise<AuthData<AuthInfo> & { expiration: string; refreshToken: string }>
            >()
            .mockImplementationOnce(() => new Promise((_, reject) => (rejectFirstAttempt = reject)))
            .mockImplementation(async () => freshTokens());
        const refresh = setRefreshTokenHook<AuthInfo>(id, refreshTokenHandler, { retry: () => true });

        await authenticate<AuthInfo>(id, {
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            expiration: hourFromNow(),
            authInfo,
        });

        const refreshing = refresh({ forceRefresh: true });

        await vi.waitFor(() => expect(refreshTokenHandler).toHaveBeenCalledTimes(1));

        // Another tab has rotated the refresh token, so the in-flight attempt fails.
        await authenticate<AuthInfo>(id, {
            accessToken: 'other-tab-access-token',
            refreshToken: 'other-tab-refresh-token',
            expiration: hourFromNow(),
            authInfo,
        });
        rejectFirstAttempt(new Error('Refresh token already used'));

        await refreshing;

        expect(refreshTokenHandler).toHaveBeenCalledTimes(2);
        expect(refreshTokenHandler.mock.calls[1]![0].refreshToken).toBe('other-tab-refresh-token');

        await destroy(id);
    });

    test('should keep authInfo delivered by another tab while the refresh was in flight', async () => {
        const id = create({ id: getTestInstanceId() });

        setFetchAuthInfoHook<AuthInfo>(id, async () => authInfo);

        let resolveRefresh: (tokens: ReturnType<typeof freshTokens>) => void = () => {};
        const refreshTokenHandler = vi.fn(
            () => new Promise<ReturnType<typeof freshTokens>>(resolve => (resolveRefresh = resolve)),
        );
        const refresh = setRefreshTokenHook<AuthInfo>(id, refreshTokenHandler);

        await authenticate<AuthInfo>(id, {
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            expiration: hourFromNow(),
            authInfo,
        });

        const refreshing = refresh({ forceRefresh: true });

        await vi.waitFor(() => expect(refreshTokenHandler).toHaveBeenCalledTimes(1));

        const otherTabAuthInfo = { userId: 'other-tab-user' };
        await authenticate<AuthInfo>(id, {
            accessToken: 'other-tab-access-token',
            refreshToken: 'test-refresh-token',
            expiration: hourFromNow(),
            authInfo: otherTabAuthInfo,
        });
        resolveRefresh(freshTokens());

        expect((await refreshing).data?.authInfo).toEqual(otherTabAuthInfo);

        await destroy(id);
    });

    test('should not retry a refresh when the session was destroyed between attempts', async () => {
        const id = create({ id: getTestInstanceId() });

        let destroying: Promise<void> = Promise.resolve();
        const refreshTokenHandler = vi.fn(async () => {
            throw new TypeError('Failed to fetch');
        });
        const refresh = setRefreshTokenHook<AuthInfo>(id, refreshTokenHandler, {
            retry: async () => {
                const signedOut = new Promise<void>(resolve => {
                    onAuthStateChanged<AuthInfo>(id, session => {
                        if (session.status === 'unauthenticated') {
                            resolve();
                        }
                    });
                });

                destroying = destroy(id);
                await signedOut;

                return true;
            },
        });

        await authenticate<AuthInfo>(id, {
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            expiration: hourFromNow(),
        });

        await expect(refresh({ forceRefresh: true })).rejects.toMatchObject({ code: 'bear-auth/not-authenticated' });
        expect(refreshTokenHandler).toHaveBeenCalledTimes(1);

        await destroying;
    });
});
