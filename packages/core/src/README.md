# 🐻 Bear Auth

## API Draft

```ts
const bearAuth = await create();

// Set inputs
const refreshToken = setHook(bearAuth, 'refreshToken', refreshToken);
// await refreshToken({ forceRefresh: true })

const refetchUser = setHook(bearAuth, 'fetchAuthInfo', fetchAuthInfo);
// await refetchUser()

const signOut = setHook(bearAuth, 'unauthenticate', unauthenticate);
// await signOut()

// Internal hooks

await setStorage(bearAuth, {
    async set() {},
    async get() {},
    async remove() {},
    async clear() {},
});

setLogger(bearAuth, console);

const unsubscribe = onAuthStateChanged(bearAuth, async (prevState, nextState) => {});

// ----

// starts the auth session retrieval, if auth session has been prev. persisted or just waits for other methods to be called
await start(bearAuth);

// Pass JWT token sign-up or sign-in
await authenticate(bearAuth, {
    accessToken: '...',
    refreshToken: '...', // optional
    expiresIn: 3600, // optional
    // Arbitrary optional authenticated data (e.g. user info)
    authInfo: {
        // ...
    },
});

const token: string = await getAccessToken(bearAuth, { forceRefresh: true });

// Terminates the auth flow, clears everything, can't use the instance anymore
await destroy(bearAuth);

console.log(bearAuth);
```
