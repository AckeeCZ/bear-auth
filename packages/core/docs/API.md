# Bear Auth API

## Configuration methods

The following methods can be most like used to configure the BearAuth instance before calling `authenticate` or `retrieveAuthSession` methods:

### `create`

Initializes a BearAuth instance. Cannot be called multiple times with the same instance ID without calling `destroy` first.

#### Arguments:

- `id?: string`: optional instance ID

#### Example:

```typescript
import { create } from '@bear-auth/core';

const id = create({ id: 'myInstance' });
```

### `setFetchAuthInfoHook`

Configures a function to fetch auth info from an API, required when the `authenticate` method returns `authInfo`.

#### Arguments:

- `id: string`: return value of `create` method
- `handler: (authSession: AuthenticatedSession<AuthInfo>['data']) => Promise<AuthInfo>`: function to fetch the auth info

#### Example:

```typescript
import { setFetchAuthInfoHook } from '@bear-auth/core';

const refetchAuthInfo = setFetchAuthInfoHook<AuthInfo>(
    'myInstance',
    async session => {
        // Fetch auth info logic
    },
    {
        // Optional retry (sync/async) callback or boolean (default `false`)
        // If `true`, it will retry up to internal limit (5).
        retry(error, failureCount) {
            return failureCount < 3;
        },
    },
);
```

### `setRefreshTokenHook`

Configures a function to refresh the access token via an API call, required when `authenticate` returns `refreshToken` and `expiration`.

#### Arguments:

- `id: string`: return value of `create` method
- `handler: (authSession: RefreshingSession<AuthInfo>['data']) => Promise<RefreshingSession<AuthInfo>['data']>`: function to refresh the access token

#### Example:

```typescript
import { setRefreshTokenHook } from '@bear-auth/core';

const refreshToken = setRefreshTokenHook<AuthInfo>(
    'myInstance',
    async session => {
        // Refresh token logic
        return {
            expiration: '...', // timestamp in ISO format
            accessToken: '...',
            refreshToken: '...'
            // Optionally, refreshed auth. info:
            authInfo: {
                // ...
            }
        }
    },
    {
        // Optional retry (sync/async) callback or boolean (default `false`)
        // If `true`, it will retry up to internal limit (5).
        async retry(error, failureCount) {
            return failureCount < 3;
        },
    },
);
```

### `setLogoutHook`

Sets a function to log out the user via an API call to the app's backend.

#### Arguments:

- `id: string`: return value of `create` method
- `handler: (authSession: AuthenticatedSession<AuthInfo>['data']) => Promise<void>`: function to logout the user

#### Example:

```typescript
import { setLogoutHook } from '@bear-auth/core';

const logout = setLogoutHook<AuthInfo>(
    'myInstance',
    async session => {
        // Logout logic
    },
    {
        // Optional retry (sync/async) callback or boolean (default `false`)
        // If `true`, it will retry up to internal limit (5).
        retry: true,
    },
);
```

### `onAuthStateChanged`

Registers a callback to be called whenever the auth state changes.

#### Arguments:

- `id: string`: return value of `create` method
- `callback: (session: BearAuth<AuthInfo>['state']['session']) => Promise<void> | void`: function to be called when the auth state changes

#### Example:

```typescript
import { onAuthStateChanged } from '@bear-auth/core';

const unsubscribe = onAuthStateChanged<AuthInfo>('myInstance', session => {
    console.log(session);
});

// To unsubscribe
unsubscribe();
```

### `destroy`

Destroys the BearAuth instance, logging out the user, clearing storage, and deleting the instance.

#### Arguments:

- `id: string`: return value of `create` method

#### Example:

```typescript
import { destroy } from '@bear-auth/core';

await destroy('myInstance');
```

### `setContinueWhenOnline`

- Sets a custom method that resolves when the network is online, waiting if offline.
- By default, it uses `navigator.onLine` to check the network status and the `window.addEventListener('online')` event to wait for the network to come back online (which might not be accurate in some cases).

#### Arguments:

- `id: string`: return value of `create` method
- `continueWhenOnline: () => Promise<void>`: function that returns a promise

#### Example:

```typescript
import { setContinueWhenOnline } from '@bear-auth/core';

setContinueWhenOnline('myInstance', async taskName => {
    // Set custom code to tell the Bear Auth when the app is online and can proceed with given task.
    // Optionally, you can decide based on the `taskName` ('logout', 'refreshToken', etc.)
});
```

### `setStorage`

- Sets custom storage to persist the auth session.
- Default no storage is used, i.e. auth session isn't persisted.
- Recommended is to use IndexedDB storage from [`@bear-auth/storage`](../../storage/README.md) package.

#### Arguments:

- `id: string`: return value of `create` method
- `storage: StorageSchema<AuthInfo>`: storage schema

#### Example:

```typescript
import { setStorage } from '@bear-auth/core';

setStorage('myInstance', {
    version: 1,
    set: async (id, data) => {
        // Set logic
    },
    get: async id => {
        // Get logic
    },
    remove: async id => {
        // Remove logic
    },
    clear: async id => {
        // Clear logic
    },
});
```

### `setAuthSessionPropagation`

Let's consider a user opens your app in two different tabs.<br/>
How should the authentication session be handled in this case?<br/>
Choose one of the following auth session propagation strategies:

1. `lazy` – The auth session is synchronized on a tab focus through persisted storage (e.g. IndexedDB or `localStorage`) shared by all clients.
2. `sync` - The auth session is synchronized immediately across all clients using the BroadcastChannel API.
3. `none` - The auth session is not updated in different clients (tabs) unless the page is hard-reloaded or the user logs in again.

Default value is determined based on enviroment and supported APIs. So defalut value is:

1. `sync` if the `globalThis.BroadcastChannel` is available
2. `lazy` if the `globalThis.document.visibilityState` is available
3. `none` if none of the web APIs above are avaiable.

#### Arguments:

- `id: string`: return value of `create` method
- `type: AuthSessionPropagationType`: authentication session propagation strategy

#### Example:

```ts
import { setAuthSessionPropagation } from '@bear-auth/core';

setAuthSessionPropagation('myInstanceId', 'sync');
```

### `setAlarmManager`

Optionally, you can override the defaults `setTimeout` / `clearTimeout` methods to implement a custom timer, such as:

```ts
import { setAlarmManager } from '@bear-auth/core';

setAlarmManager('myInstanceId', {
    async createAlarm(callback, delay) {
        // create alarm, return alarm ID
    },
    async clearAlarm(id, callback) {
        // clear alarm
    },
});
```

---

## Runtime methods

Once the BearAuth has been configured, the following methods can be used:

### `retrieveAuthSession`

Attempts to retrieve the auth session from storage, refreshes tokens if needed, and handles session persistence.

#### Arguments:

- `id: string`: return value of `create` method

#### Example:

```typescript
import { retrieveAuthSession } from '@bear-auth/core';

const session = await retrieveAuthSession<AuthInfo>('myInstance');
console.log(session);
```

### `authenticate`

Once a user signs-in or signs-up, this method is called to pass the authentication data to the library. Only `accessToken` is required. `expiration` and `refreshToken` are optional.

#### Arguments:

- `id: string`: return value of `create` method
- `props: AuthenticateProps<AuthInfo>`: authentication data

#### Example:

```typescript
import { authenticate } from '@bear-auth/core';

type AuthInfo = {
    email: string;
};

const bearAuthId = create();

await authenticate<AuthInfo>(bearAuthId, {
    accessToken: 'yourAccessToken',
    refreshToken: 'yourRefreshToken',
    expiration: new Date(Date.now() + 30_000).toISOString(), // expires in 30s
    authInfo: { email: 'user@email.com' },
});
```

### `getAccessToken`

- Retrieves the access token, makes requests to refresh the token if necessary.
- Can be called anytime.

#### Arguments:

- `id: string`: return value of `create` method
- `options?: { forceRefresh?: boolean }`: options for token retrieval

#### Example:

```typescript
import { getAccessToken } from '@bear-auth/core';

const token = await getAccessToken('myInstance', { forceRefresh: true });
console.log(token);
```

---

## Helpers

### `getExpirationTimestamp`

Convert the `expiresIn` value in ms to a ISO timestamp representing the expiration time.

#### Arguments:

- `expiresIn: number`

#### Example

```ts
const expiration = getExpirationTimestamp(30_000); // returns ISO timestamp 30s in the future
```

### `isBearAuthError`

TypeScript guard function to recognize `BearAuthError`.

#### Arguments:

- `error: unknown`: the error to check

#### Example:

```typescript
import { isBearAuthError } from '@bear-auth/core';

const error = new Error('Some error');
if (isBearAuthError(error)) {
    console.log('This is a BearAuthError');
}

// or you can specify the error codes you want to handle
function foo() {
    try {
        // ...
    } catch (error) {
        if (isBearAuthErrorWithCodes(error, ['bear-auth/refresh-token-failed'])) {
            console.error(error.code, error.originalError, error.message);
        }
    }
}
```

### `Session`

Represents the session state.

#### Example:

```typescript
import type { Session } from '@bear-auth/core';

type AuthInfo = {
    email: string;
}

const session: Session<AuthInfo> = {
    status: 'authenticated',
    data: {
        accessToken: 'yourAccessToken',
        expiration: '2024-12-31T23:59:59Z',
        refreshToken: 'yourRefreshToken',
        authInfo: {
            email: 'test@gmail.com
        },
    },
};
```

### `getCreatedBearAuths`

Retrieves all active BearAuth instance IDs.

#### Example:

```typescript
import { getCreatedBearAuths } from '@bear-auth/core';

const activeInstances = getCreatedBearAuths();
console.log(activeInstances);
```
