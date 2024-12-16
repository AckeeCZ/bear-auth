# 🐻 Bear Auth React

An integration of [`@bear-auth/core`](https://github.com/AckeeCZ/bear-auth/blob/main/packages/core) for React. 

## Install

```sh
yarn add @bear-auth/core
```

## Get started


### 1. Configure bear auth

```tsx
import { create, setStorage } from '@bear-auth/core'
import { createIndexedDBStorage } from '@bear-auth/storage' 

// Configure the bear auth:

// 1. init a new instance
export const bearAuthId = create();

export type AuthInfo = {
    user: {
        id: string;
        username: string;
    };
};

// 2. set storage for persistance (optional)
const storage = createIndexedDBStorage<AuthInfo>({
    bearAuthId,
    authInfo: z.object({
        user: z.object({
            id: z.string(),
            username: z.string(),
        }),
    }),
});

setStorage<AuthInfo>(bearAuthId, storage);

// 3. Set hooks for fetching auth info (optional), refreshing access token (optional) and logout (required):
const refetchAuthInfo = setFetchAuthInfoHook<AuthInfo>(bearAuthId, async () => {
    // TODO: do actual API call to fetch info about currently authenticated user
    return {
        user: {
            id: 'some-user-id',
            username: 'updated-user@email.com',
        },
    } satisfies AuthInfo;
});

const refreshToken = setRefreshTokenHook<AuthInfo>(bearAuthId, async () => {
    // TODO: do actual API call to refresh expired access token
    return {
        accessToken: '...fresh-access-token...',
        refreshToken: '...refresh-token...',
        expiration: new Date(Date.now() + 30_000).toISOString(), // expires in 30s
    };
});

const logout = setLogoutHook<AuthInfo>(bearAuthId, async () => {
    // TODO: call API and logout current auth. user
    console.log('logout');
});

// Note that each of these hooks returns async function which you can use to trigger the hook by yourself if needed.
```


### 2. Use `BearAuthProvider`:

Use `useBearAuthSession` and `useBearAuth` hooks within the context of `BearAuthProvider`:

```tsx
import { BearAuthProvider } from '@bear-auth/react'
import { type AuthInfo, bearAuthId } from '...'

export function App() {
    return (
        // Pass current instance ID and those hook actions:
        <BearAuthProvider id={bearAuthId} actions={{ refetchAuthInfo, refreshToken, logout }}>
            <BearAuthSection />
        </BearAuthProvider>
    );
}


export function BearAuthSection() {
    const session = useBearAuthSession<AuthInfo>();
    const { id, actions } = useBearAuth<AuthInfo>();

    console.log({ id, actions, session })

    return <div>
        {session.status}
        {session.status === 'authenticated' && <button type='button' onClick={() => actions.logout()}>
            Logout
        </button>}
    </div>
}
```

### 3. Authenticate user

```tsx
import { authenticate } from '@bear-auth/core'
import { type AuthInfo, bearAuthId } from '....'

<button
    type='button'
    onClick={async () => {
        // TODO: sign-in / sign-up user and then call the `authenticate` method with received access token (the rest of props is still recommended but optional).

        await authenticate<AuthInfo>(bearAuthId, {
            accessToken: '...access-token...',
            expiration: new Date(Date.now() + 30_000).toISOString(), // expires in 30s
            refreshToken: '...refresh-token...',
            authInfo: {
                user: {
                    id: 'some-user-id',
                    username: 'some-user@email.com',
                },
            },
        })
    }}
>
    Authenticate
</button>
```

👉 The usage [example](https://github.com/AckeeCZ/bear-auth/blob/main/examples/react).