# @bear-auth/react

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
