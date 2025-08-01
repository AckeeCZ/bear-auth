# 🐻 Bear Auth

Bear auth contains a set of methods for managing JWT tokens in single page applications.

## Features

- 🪶 **Ultra-light**
    - `@bear-auth/core`: [6.3 kB (min + gzip)](https://bundlephobia.com/package/@bear-auth/core)
    - `@bear-auth/react`: [0.55 kB (min + gzip)](https://bundlephobia.com/package/@bear-auth/react)
    - `@bear-auth/storage`: [2.9 kB (min + gzip)](https://bundlephobia.com/package/@bear-auth/storage)
- ♻️ **Auto access token refreshment**
    - If the `authenticate` method returns valid `expiration` and `refreshToken`, the `@bear-auth/core` will use the refresh token hook to maintain fresh access token.
- 🛜 **Network status detection**
    - To avoid refreshing access token while the app is offline.
    - By default it uses `navigator.onLine` flag and the `online` event but can be changed via the `setContinueWhenOnline` method.
- 🌊 **Auth session propagation strategies**
    - Synchronize an authentication session across multiple tabs.
- 🏗️ **Highly customizable**
    - You can override almost all the default behaviour – storage, network, etc.
- 💨 **Tree-shakeable & side-effect free**
    - The API has been designed as pure functions (rather than one heavy object) to support tree-shaking.
- 🙈 **Framework agnostic**
    - The `@bear-auth/core` consists of just (promised-based) TypeScript vanilla methods. No attachment to library/framework.
    - There is currently one official integration for [React](./packages/react) but others can be easily implemented.
- ✅ **Strongly typed**
- ✨ **Multiple instances per origin**
- 👨‍🚒 **Custom error & guard functions for easier error handling**
    - `isBearAuthError(error: unknown): error is BearAuthError`
    - `isBearAuthError(error: unknown, ['bear-auth/retrieve-auth-session-failed']): error is BearAuthError<'bear-auth/retrieve-auth-session-failed'>`

## Packages

- [`@bear-auth/core`](./packages/core)
- [`@bear-auth/react`](./packages/react)
- [`@bear-auth/storage`](./packages/storage)

## Examples

- [`@bear-auth/core` example](./examples/core)
- [`@bear-auth/react` example](./examples/react)
