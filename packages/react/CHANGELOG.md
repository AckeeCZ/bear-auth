# @bear-auth/react

## 3.0.8

### Patch Changes

- e0e02b1: Bugs fixing and minor improvements.
- Updated dependencies [e0e02b1]
    - @bear-auth/core@3.0.8

## 3.0.7

### Patch Changes

- e858f00: Bugfix in setFetchAuthInfoHook.
- Updated dependencies [e858f00]
    - @bear-auth/core@3.0.7

## 3.0.6

### Patch Changes

- f73206e: 🔧 Refactor updateAuthInfo to handle unauthenticated session.
- Updated dependencies [f73206e]
    - @bear-auth/core@3.0.6

## 3.0.5

### Patch Changes

- b760c40: Update session broadcast channel name.
- Updated dependencies [b760c40]
    - @bear-auth/core@3.0.5

## 3.0.4

### Patch Changes

- 3759a82: Switch from Bundler to NodeNext module resolution.
- Updated dependencies [3759a82]
    - @bear-auth/core@3.0.4

## 3.0.3

### Patch Changes

- 87a7e8b: Fix CJS export.
- Updated dependencies [87a7e8b]
    - @bear-auth/core@3.0.3

## 3.0.2

### Patch Changes

- fc8c908: Add CJS support.
- Updated dependencies [fc8c908]
    - @bear-auth/core@3.0.2

## 3.0.1

### Patch Changes

- e3c4395: Add CJS support.
- Updated dependencies [e3c4395]
    - @bear-auth/core@3.0.1

## 3.0.0

### Major Changes

- 56e8a1d: Implement auth session propagation feature.

### Patch Changes

- Updated dependencies [56e8a1d]
    - @bear-auth/core@3.0.0

## 2.1.8

### Patch Changes

- 7ddbd5f: Upgrade dependencies and fix getAccessToken.
- Updated dependencies [7ddbd5f]
    - @bear-auth/core@2.1.8

## 2.1.7

### Patch Changes

- a383752: Fix auth state retrieval.
- Updated dependencies [a383752]
    - @bear-auth/core@2.1.7

## 2.1.6

### Patch Changes

- 9acc842: Fix state management.
- Updated dependencies [9acc842]
    - @bear-auth/core@2.1.6

## 2.1.5

### Patch Changes

- 6ce8aba: ♻️ Extend auth session validity.
- Updated dependencies [6ce8aba]
    - @bear-auth/core@2.1.5

## 2.1.4

### Patch Changes

- 253251a: Fix circular type.
- Updated dependencies [253251a]
    - @bear-auth/core@2.1.4

## 2.1.3

### Patch Changes

- 4ebd003: Upgrade idb-store.
- Updated dependencies [4ebd003]
    - @bear-auth/core@2.1.3

## 2.1.2

### Patch Changes

- ccd44b5: Update dependency.

## 2.1.1

### Patch Changes

- 60f56d2: Update dependency.

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
