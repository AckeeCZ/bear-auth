import {
    create,
    getExpirationTimestamp,
    setFetchAuthInfoHook,
    setLogger,
    setLogoutHook,
    setRefreshTokenHook,
    setStorage,
} from '@bear-auth/core';
import { BearAuthProvider } from '@bear-auth/react';

import './styles/App.css';

import { createIndexedDBStorage } from '@bear-auth/storage';
import { z } from 'zod';

import { AuthBearSection } from './AuthBearSection';
import { generateMockToken } from './utils';

const authInfo = z
    .object({
        user: z.object({
            id: z.string(),
            username: z.string(),
        }),
    })
    .strict();

export type AuthInfo = z.infer<typeof authInfo>;

const bearAuthId = create();

setLogger(bearAuthId, console);

const storage = createIndexedDBStorage({
    bearAuthId,
    authInfo,
});

setStorage(bearAuthId, storage);

const refetchAuthInfo = setFetchAuthInfoHook<AuthInfo>(bearAuthId, async () => {
    return {
        user: {
            id: 'some-user-id',
            username: 'updated-user@email.com',
        },
    } satisfies AuthInfo;
});

const refreshToken = setRefreshTokenHook<AuthInfo>(bearAuthId, async () => {
    return {
        accessToken: generateMockToken('accessToken'),
        refreshToken: generateMockToken('refreshToken'),
        expiration: getExpirationTimestamp(250_000), // 250s
    };
});

const logout = setLogoutHook<AuthInfo>(bearAuthId, async () => {
    console.log('logout');
});

function App() {
    return (
        <>
            <h1>Bear Auth - React Example</h1>
            <BearAuthProvider<AuthInfo> id={bearAuthId} actions={{ refetchAuthInfo, refreshToken, logout }}>
                <AuthBearSection />
            </BearAuthProvider>
        </>
    );
}

export default App;
