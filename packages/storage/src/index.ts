import { type SessionData } from '@bear-auth/core';
import { initIDB } from 'idb-stores';
import { z, type AnyZodObject } from 'zod';

type UnknownAuthInfoSchema = AnyZodObject;

export interface CreateStorageProps<AuthInfoSchema extends UnknownAuthInfoSchema, BearAuthId extends Readonly<string>> {
    /**
     * Bear auth instance ID (return value of the `create` method)
     */
    bearAuthId: BearAuthId;

    /**
     * Define Zod schema for the `authInfo` field of the session.data object.
     */
    authInfo: AuthInfoSchema;

    /**
     * IndexedDB configuration
     */
    db?: {
        /**
         * @current 1
         */
        version: number;
        /**
         * @current 'auth'
         */
        name: string;
    };
}

/**
 * Creates a IndexedDB storage for the Bear Auth instance.
 */
export function createIndexedDBStorage<
    AuthInfoSchema extends UnknownAuthInfoSchema,
    BearAuthId extends Readonly<string>,
>({ bearAuthId, authInfo, db }: CreateStorageProps<AuthInfoSchema, BearAuthId>) {
    const bearAuthInstanceSchema = z
        .object({
            version: z.number(),
            data: z.object({
                accessToken: z.string(),
                expiration: z.string().nullable(),
                refreshToken: z.string().nullable(),
                authInfo: authInfo.nullable(),
            }),
        })
        .strict()
        .optional();

    const storeSchemas = z
        .object({
            [bearAuthId]: bearAuthInstanceSchema,
        })
        .strict();

    const getStore = initIDB({
        database: db ?? {
            version: 1,
            name: 'bear-auth',
        },
        storeSchemas: {
            'bear-auths': storeSchemas,
        },
    });

    const store = getStore('bear-auths');

    type BearAuthInstance =
        | {
              version: number;
              data: SessionData<z.infer<AuthInfoSchema>>;
          }
        | undefined;

    return {
        version: db?.version ?? 1,
        get(key: typeof bearAuthId) {
            return store.get<typeof bearAuthId>(key) as Promise<BearAuthInstance | undefined>;
        },
        async set(key: typeof bearAuthId, value: BearAuthInstance) {
            // @ts-ignore
            await store.set(key, value);
        },
        remove: store.remove<typeof bearAuthId>,
        clear: store.clear,
    } as const;
}
