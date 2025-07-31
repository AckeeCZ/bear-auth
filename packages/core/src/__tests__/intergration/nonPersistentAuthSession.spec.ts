import { describe, expect, test, vi } from 'vitest';

import { authenticate } from '../../authenticate.ts';
import { create } from '../../create.ts';
import { destroy } from '../../destroy.ts';
import { BearAuthError } from '../../errors.ts';
import { getExpirationTimestampWithBuffer } from '../../expiration.ts';
import { getAccessToken } from '../../getAccessToken.ts';
import { setFetchAuthInfoHook } from '../../hooks/setFetchAuthInfoHook.ts';
import { setLogoutHook } from '../../hooks/setLogoutHook.ts';
import { setRefreshTokenHook } from '../../hooks/setRefreshTokenHook.ts';
import { instances } from '../../instances.ts';
import { setContinueWhenOnline } from '../../network.ts';
import type { Session } from '../../store/session.ts';

describe('Non-Persistent Authentication Session Flows', () => {
    test('should authenticate only with an access token', async () => {
        const id = 'bear-auth-browser-test-1';
        create({ id });

        const accessToken = 'test-access-token';

        const logoutHandler = vi.fn();
        const logout = setLogoutHook(id, logoutHandler);

        const continueWhenOnline = vi.fn();
        setContinueWhenOnline(id, continueWhenOnline);

        const result = await authenticate(id, { accessToken });

        expect(result).toEqual({
            status: 'authenticated',
            data: {
                accessToken,
                authInfo: null,
                refreshToken: null,
                expiration: null,
            },
        } satisfies typeof result);

        expect(instances.get(id)?.state.session).toEqual({
            status: 'authenticated',
            data: {
                accessToken,
                authInfo: null,
                refreshToken: null,
                expiration: null,
            },
        } satisfies Session<unknown>);

        expect(await getAccessToken(id)).toBe(accessToken);

        await logout();

        expect(await getAccessToken(id)).toBeNull();

        expect(logoutHandler).toHaveBeenCalledTimes(1);
        expect(logoutHandler).toHaveBeenCalledWith({
            accessToken,
            authInfo: null,
            refreshToken: null,
            expiration: null,
        });

        expect(instances.get(id)?.state.session).toEqual({
            status: 'unauthenticated',
            data: null,
        } satisfies Session<unknown>);

        expect(continueWhenOnline).toHaveBeenCalledTimes(1);
        expect(continueWhenOnline).toHaveBeenCalledWith('logout');

        await destroy(id);
    });

    test('should authenticate with an access token and expiration', async () => {
        const id = 'bear-auth-browser-test-2';
        create({ id });

        const accessToken = 'test-access-token';
        const expiration = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour from now

        const logoutHandler = vi.fn();
        const logout = setLogoutHook(id, logoutHandler);

        const result = await authenticate(id, {
            accessToken,
            expiration,
        });

        expect(result.status).toBe('authenticated');
        expect(result.data).toEqual({
            accessToken,
            authInfo: null,
            refreshToken: null,
            expiration: getExpirationTimestampWithBuffer(expiration),
        } satisfies typeof result.data);

        expect(await getAccessToken(id)).toBe(accessToken);

        await logout();

        expect(logoutHandler).toBeCalledTimes(1);
        expect(await getAccessToken(id)).toBeNull();

        await destroy(id);
    });

    test('should authenticate with an access token, expiration, refresh token', async () => {
        const id = 'bear-auth-browser-test-3';
        create({ id });

        const accessToken = 'test-access-token';
        const expiration = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour from now
        const refreshToken = 'test-refresh-token';
        const freshAccessToken = 'fresh-access-token';

        const logoutHandler = vi.fn();
        const logout = setLogoutHook(id, logoutHandler);

        const continueWhenOnline = vi.fn();
        setContinueWhenOnline(id, continueWhenOnline);

        const refreshTokenHandler = vi.fn(async () => {
            return {
                accessToken: freshAccessToken,
                expiration,
                refreshToken,
            };
        });
        const refreshTokenTrigger = setRefreshTokenHook(id, refreshTokenHandler);

        expect(refreshTokenTrigger).instanceOf(Function);

        const authResult = await authenticate(id, {
            accessToken,
            expiration,
            refreshToken,
        });

        expect(authResult.status).toBe('authenticated');
        expect(authResult.data).toEqual({
            accessToken,
            authInfo: null,
            refreshToken,
            expiration: getExpirationTimestampWithBuffer(expiration),
        } satisfies typeof authResult.data);

        expect(await getAccessToken(id)).toBe(accessToken);

        // Call refresh token trigger without forcing a new access token if the token has not expired yet
        const refreshResult = await refreshTokenTrigger();

        expect(refreshTokenHandler).toBeCalledTimes(0);

        expect(refreshResult).toEqual({
            status: 'authenticated',
            data: {
                accessToken,
                expiration: getExpirationTimestampWithBuffer(expiration),
                refreshToken,
                authInfo: null,
            },
        } satisfies typeof refreshResult);

        // Call refresh token trigger with forcing a new access token
        const forcedRefreshResult = await refreshTokenTrigger({ forceRefresh: true });
        expect(refreshTokenHandler).toBeCalledTimes(1);
        expect(forcedRefreshResult).toEqual({
            status: 'authenticated',
            data: {
                accessToken: freshAccessToken,
                expiration: getExpirationTimestampWithBuffer(expiration),
                refreshToken,
                authInfo: null,
            },
        } satisfies typeof forcedRefreshResult);

        expect(continueWhenOnline).toHaveBeenCalledTimes(1);
        expect(continueWhenOnline).toHaveBeenCalledWith('refreshToken');

        expect(await getAccessToken(id)).toBe(freshAccessToken);

        await logout();

        expect(logoutHandler).toBeCalledTimes(1);
        expect(await getAccessToken(id)).toBeNull();

        expect(continueWhenOnline).toHaveBeenCalledTimes(2);
        expect(continueWhenOnline).toHaveBeenCalledWith('logout');

        await destroy(id);
    });

    test('should not authenticate with an access token and invalid expiration', async () => {
        const id = 'bear-auth-browser-test-4';
        create({ id });

        const accessToken = 'test-access-token';
        const expiration = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour in the past

        await expect(
            authenticate(id, {
                accessToken,
                expiration,
            }),
        ).rejects.toThrowError(BearAuthError<'bear-auth/invalid-expires-in'>);

        expect(instances.get(id)?.state.session).toEqual({
            status: 'retrieving',
            data: null,
        } satisfies Session<unknown>);

        await destroy(id);
    });

    test('should authenticate with access token, expiration, refresh token, and authInfo', async () => {
        const id = 'bear-auth-browser-test-5';
        create({ id });

        const continueWhenOnline = vi.fn();
        setContinueWhenOnline(id, continueWhenOnline);

        const accessToken = 'test-access-token';
        const expiration = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour from now
        const refreshToken = 'test-refresh-token';
        const authInfo = { userId: 'test-user-id' };

        await expect(
            authenticate(id, { accessToken, expiration, refreshToken, authInfo }),
        ).rejects.toThrowErrorMatchingSnapshot('unset-refresh-token-hook');

        const freshAccessToken = 'fresh-access-token';

        setRefreshTokenHook(id, async () => {
            return {
                accessToken: freshAccessToken,
                expiration: getExpirationTimestampWithBuffer(expiration)!,
                refreshToken,
                authInfo,
            };
        });

        await expect(
            authenticate(id, { accessToken, expiration, refreshToken, authInfo }),
        ).rejects.toThrowErrorMatchingSnapshot('unset-fetch-auth-info-hook');

        const freshAuthInfo = { userId: 'fresh-user-id' };
        const authInfoHandler = vi.fn(async () => {
            return freshAuthInfo;
        });
        const fetchAuthInfo = setFetchAuthInfoHook(id, authInfoHandler);

        const authResult = await authenticate(id, { accessToken, expiration, refreshToken, authInfo });

        expect(authResult.status).toBe('authenticated');
        expect(authResult.data).toEqual({
            accessToken,
            expiration: getExpirationTimestampWithBuffer(expiration),
            refreshToken,
            authInfo,
        } satisfies typeof authResult.data);

        expect(authInfoHandler).toBeCalledTimes(0);

        expect(await fetchAuthInfo()).toEqual({
            status: 'authenticated',
            data: {
                accessToken,
                expiration: getExpirationTimestampWithBuffer(expiration),
                refreshToken,
                authInfo: freshAuthInfo,
            },
        } satisfies Session<unknown>);

        expect(authInfoHandler).toBeCalledTimes(1);

        expect(continueWhenOnline).toHaveBeenCalledTimes(1);
        expect(continueWhenOnline).toHaveBeenCalledWith('fetchAuthInfo');

        expect(await getAccessToken(id, { forceRefresh: true })).toBe(freshAccessToken);

        await destroy(id);
    });
});
