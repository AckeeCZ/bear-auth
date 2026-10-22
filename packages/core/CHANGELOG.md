# @bear-auth/core

## 3.0.14

### Patch Changes

- beda671: Keep `authInfo` when the access token is refreshed during session retrieval. Previously the refreshed session was built from the empty store, so `authInfo: null` was persisted and broadcast before `fetchAuthInfo` completed. An interrupted `fetchAuthInfo` (closed tab, reload, offline) then left the session without auth info for good.

    `retrieveAuthSession` now calls `fetchAuthInfo` whenever the hook is set, even when the persisted session has no `authInfo`, so such sessions recover on the next retrieval.

    Retrying a failed refresh of an active session no longer fails with `bear-auth/not-authenticated`. A retry reads the session from the store again, so it uses tokens another tab delivered while the refresh was in flight, and it stops when the session was destroyed in the meantime. A successful refresh keeps `authInfo` delivered by another tab while the refresh was in flight.

## 3.0.13

### Patch Changes

- 91d9fb6: Fix access token refreshment on session retrieval.

## 3.0.12

### Patch Changes

- fae66fc: Make possible to control the auto refresh token process by pausing / resuming it.

## 3.0.11

### Patch Changes

- 39c3ec6: Make sure network is online before hooks start.

## 3.0.10

### Patch Changes

- 3e24f1c: Extend setAlarmManager.

## 3.0.9

### Patch Changes

- b41e893: Add support for custom timer. Now it's possible via setAlarmManager method override the default setTimeout/clearTimeout methods.

## 3.0.8

### Patch Changes

- e0e02b1: Bugs fixing and minor improvements.

## 3.0.7

### Patch Changes

- e858f00: Bugfix in setFetchAuthInfoHook.

## 3.0.6

### Patch Changes

- f73206e: 🔧 Refactor updateAuthInfo to handle unauthenticated session.

## 3.0.5

### Patch Changes

- b760c40: Update session broadcast channel name.

## 3.0.4

### Patch Changes

- 3759a82: Switch from Bundler to NodeNext module resolution.

## 3.0.3

### Patch Changes

- 87a7e8b: Fix CJS export.

## 3.0.2

### Patch Changes

- fc8c908: Add CJS support.

## 3.0.1

### Patch Changes

- e3c4395: Add CJS support.

## 3.0.0

### Major Changes

- 56e8a1d: Implement auth session propagation feature.

## 2.1.8

### Patch Changes

- 7ddbd5f: Upgrade dependencies and fix getAccessToken.

## 2.1.7

### Patch Changes

- a383752: Fix auth state retrieval.

## 2.1.6

### Patch Changes

- 9acc842: Fix state management.

## 2.1.5

### Patch Changes

- 6ce8aba: ♻️ Extend auth session validity.

## 2.1.4

### Patch Changes

- 253251a: Fix circular type.

## 2.1.3

### Patch Changes

- 4ebd003: Upgrade idb-store.

## 2.1.2

### Patch Changes

- 60f56d2: Update dependency.

## 2.1.1

### Patch Changes

- d50fa73: Fix retrieveAuthSession method (pass fresh auth session to the fetchAuthInfo hook).

## 2.1.0

### Minor Changes

- 17409b7: #### Changes:

    - ♻️ Make types more accurate
    - ♻️ State management & extend session states

        - use mutable state (remove immer package)
        - remove setInstance (all changes have been already applied)
        - remove `loading` session state
        - add `retrieving`, `refreshing`, and `signing-out` session state

## 2.0.0

### Major Changes

#### Breaking changes

- 💥 Access expiration timestamp instead of expiresIn value

    The `expiresIn` properties have been changed to `expiration` timestamp in ISO format.

    Before:

    ```ts
    await authenticate<AuthInfo>(bearAuthId, {
        // ...
        expiresIn: 3000,
    });
    ```

    After:

    ```ts
    await authenticate<AuthInfo>(bearAuthId, {
        // ...
        expiration: new Date(Date.now() + 3000).toISOString(),
    });
    ```

    The same applies for the return values of the `setRefreshTokenHook` handler.

#### New features

- ✨ Add hook retry mechanism
- ✨ Support React v19
- 🔊 Add debug logs to getAccessToken
- ⬆️ Minor & patch dependencies upgrade

#### Bug fixes

- 🐛 Throw an error when using setLogLevel method with custom logger
- 🐛 Clear storage on zod schema change
- ♻️ Fix storage type

#### Internal

- 🐛 Fix prettier (on save)
- ➕ Add husky
- ♻️ Update the core example

## 1.0.3

### Patch Changes

- a1d1eae: Fix updating internal state after token refreshment.

## 1.0.2

### Patch Changes

- 641724f: Update scope of publishable files.
- 3b3f2e2: Update scope of publishable files.

## 1.0.1

### Patch Changes

- 23ff65f: Minor fixes.

## 1.0.0

### Major Changes

- a01aa84: Initial release.
