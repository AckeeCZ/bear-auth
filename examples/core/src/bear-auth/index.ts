import {
    create,
    onAuthStateChanged,
    setFetchAuthInfoHook,
    setLogoutHook,
    setRefreshTokenHook,
    setStorage,
} from '@bear-auth/core';
import { createIndexedDBStorage } from '@bear-auth/storage';
import { z } from 'zod';

export type AuthInfo = {
    user: {
        id: string;
        email: string;
    };
};

export const bearAuthId = create();

// setLogLevel(bearAuthId, 'debug');

const storage = createIndexedDBStorage<AuthInfo>({
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

onAuthStateChanged<AuthInfo>(bearAuthId, async session => {
    console.log('onAuthStateChanged', session.status);
});

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
        accessToken: '...fresh-access-token...',
        refreshToken: '...refresh-token...',
        expiresIn: 120,
    };
});

export const logout = setLogoutHook<AuthInfo>(bearAuthId, async () => {});
