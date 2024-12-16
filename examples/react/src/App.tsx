import {
    create,
    getExpirationTimestamp,
    setFetchAuthInfoHook,
    setLogLevel,
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

export type AuthInfo = {
    user: {
        id: string;
        username: string;
    };
};

const bearAuthId = create();

setLogLevel(bearAuthId, 'debug');

const storage = createIndexedDBStorage({
    bearAuthId,
    authInfo: z.object({
        user: z.object({
            id: z.string(),
            username: z.string(),
        }),
    }),
});

setStorage<AuthInfo>(bearAuthId, storage);

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
            <BearAuthProvider id={bearAuthId} actions={{ refetchAuthInfo, refreshToken, logout }}>
                <AuthBearSection />
            </BearAuthProvider>
        </>
    );
}

export default App;
