# 🐻 Bear Auth

Bear auth contains a set of methods for managing JWT tokens in single page applications.

## Features
- 🪶 __Ultra-light__
    - `@bear-auth/core`: [7.1 kB (min + gzip)](https://bundlephobia.com/package/@bear-auth/core)
    - `@bear-auth/react`: [0.55 kB (min + gzip)](https://bundlephobia.com/package/@bear-auth/react)
    - `@bear-auth/storage`: [0.44 kB (min + gzip)](https://bundlephobia.com/package/@bear-auth/storage)
- ♻️ __Auto access token refreshment__
    - If the `authenticate` method returns `expiresIn` and `refreshToken`, the `@bear-auth/core` will use the refresh token hook to maintain fresh access token.
- 🛜 __Network status detection__
    - To avoid refreshing access token while the app is offline.
    - By default it uses `navigator.onLine` flag and the `online` event but can be changed via the `setContinueWhenOnline` method.
- 🏗️ __Highly customizable__
    - You can override almost all the default behaviour – storage, network, etc.
- 💨 __Tree-shakeable & side-effect free__
    - The API has been designed as pure functions (rather than one heavy object) to support tree-shaking.
- 🙈 __Framework agnostic__
    - The `@bear-auth/core` consists of just (promised-based) TypeScript vanilla methods. No attachment to library/framework.
    - There is currently one official integration for [React](./packages/react) but others can be easily implemented.
- ✅ __Strongly typed__
- ✨ __Multiple instances per origin__ 
- 👨‍🚒 __Custom error & guard functions for easier error handling__
    - `isBearAuthError(error: unknown): error is BearAuthError`
    - `isBearAuthError(error: unknown, ['bear-auth/retrieve-auth-session-failed']): error is BearAuthError<'bear-auth/retrieve-auth-session-failed'>`


## Packages

- [`@bear-auth/core`](./packages/core)
- [`@bear-auth/react`](./packages/react)
- [`@bear-auth/storage`](./packages/storage)

## Examples

- [`@bear-auth/core` example](./examples/core)
- [`@bear-auth/react` example](./examples/react)
