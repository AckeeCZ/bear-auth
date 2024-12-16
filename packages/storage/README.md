# 🐻 Bear Auth Storage

A simple wrapper function for creating a IndexedDB storage object for `setStorage` method from [`@bear-auth/core`](https://github.com/AckeeCZ/bear-auth/blob/main/packages/core).

```sh
yarn add @bear-auth/storage
```

```ts
import { create, setStorage } from '@bear-auth/core';
import { createIndexedDBStorage } from '@bear-auth/storage';
import { z } from 'zod';

type AuthInfo = {
    user: {
        id: string;
        email: string;
    };
};

const bearAuthId = create();

const storage = createIndexedDBStorage<AuthInfo>({
    bearAuthId,

    // Define zod schema of `session.data.authInfo` value:
    authInfo: z.object({
        user: z.object({
            id: z.string(),
            email: z.string(),
        }),
    }),

    // Optionally, set custom IndexedDB name and version:
    // db: {
    //     name: 'my-app',
    //     version: 1,
    // }
});

setStorage<AuthInfo>(bearAuthId, storage);
```
