import {
    create,
    getExpirationTimestamp,
    setFetchAuthInfoHook,
    setLogLevel,
    setLogoutHook,
    setRefreshTokenHook,
    setStorage,
} from '@bear-auth/core';
import { createIndexedDBStorage } from '@bear-auth/storage';
import { z } from 'zod';

import { delay, generateMockToken } from '../utils';

export const bearAuthId = create();

setLogLevel(bearAuthId, 'debug');

const authInfo = z
    .object({
        user: z.object({
            id: z.string(),
            email: z.string(),
        }),
    })
    .strict();

export type AuthInfo = z.infer<typeof authInfo>;

const storage = createIndexedDBStorage({
    bearAuthId,
    authInfo,
});

setStorage(bearAuthId, storage);

// setContinueWhenOnline(bearAuthId, async () => {});

setFetchAuthInfoHook<AuthInfo>(
    bearAuthId,
    async () => {
        await delay(1_000);

        return {
            user: {
                id: 'some-user-id',
                email: 'updated-user@email.com',
            },
        } satisfies AuthInfo;
    },
    {
        retry: async (error, failureCount) => {
            console.error('fetchAuthInfoHook error', error);
            return failureCount < 3;
        },
    },
);

setRefreshTokenHook<AuthInfo>(
    bearAuthId,
    async () => {
        await delay(5_000);

        return {
            accessToken: generateMockToken('accessToken'),
            refreshToken: generateMockToken('refreshToken'),
            expiration: getExpirationTimestamp(250_000), // 250s
        };
    },
    {
        retry: (error, failureCount) => {
            console.error('fetchAuthInfoHook error', error);

            return failureCount < 3;
        },
    },
);

export const logout = setLogoutHook<AuthInfo>(bearAuthId, async () => {});
