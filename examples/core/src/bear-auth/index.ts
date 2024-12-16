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

import { generateMockToken } from '../utils';

export type AuthInfo = {
    user: {
        id: string;
        email: string;
    };
};

export const bearAuthId = create();

setLogLevel(bearAuthId, 'debug');

const storage = createIndexedDBStorage({
    bearAuthId,
    authInfo: z.object({
        user: z.object({
            id: z.string(),
            email: z.string(),
        }),
    }),
});

setStorage<AuthInfo>(bearAuthId, storage);

// setContinueWhenOnline(bearAuthId, async () => {});

setFetchAuthInfoHook<AuthInfo>(bearAuthId, async () => {
    return {
        user: {
            id: 'some-user-id',
            email: 'updated-user@email.com',
        },
    } satisfies AuthInfo;
});

setRefreshTokenHook<AuthInfo>(bearAuthId, async () => {
    return {
        accessToken: generateMockToken('accessToken'),
        refreshToken: generateMockToken('refreshToken'),
        expiration: getExpirationTimestamp(250_000), // 250s
    };
});

export const logout = setLogoutHook<AuthInfo>(bearAuthId, async () => {});
