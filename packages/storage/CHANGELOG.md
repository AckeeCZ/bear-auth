# @bear-auth/storage

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
- Updated dependencies [a1d1eae]
    - @bear-auth/core@1.0.3

## 1.0.2

### Patch Changes

- 641724f: Update scope of publishable files.
- 3b3f2e2: Update scope of publishable files.
- Updated dependencies [641724f]
- Updated dependencies [3b3f2e2]
    - @bear-auth/core@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [23ff65f]
    - @bear-auth/core@1.0.1

## 1.0.0

### Major Changes

- a01aa84: Initial release.

### Patch Changes

- Updated dependencies [a01aa84]
    - @bear-auth/core@1.0.0
