import { initIDB } from 'idb-stores';
import { z, type AnyZodObject } from 'zod';

type UnknownAuthInfoSchema = AnyZodObject;

export interface CreateStorageProps<AuthInfoSchema extends UnknownAuthInfoSchema> {
    /**
     * Bear auth instance ID (return value of the `create` method)
     */
    bearAuthId: string;

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
export function createIndexedDBStorage<AuthInfoSchema extends UnknownAuthInfoSchema>({
    bearAuthId,
    authInfo,
    db,
}: CreateStorageProps<AuthInfoSchema>) {
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
        .optional();

    const getStore = initIDB({
        database: db ?? {
            version: 1,
            name: 'bear-auth',
        },
        storeSchemas: {
            'bear-auths': z.object({
                [bearAuthId]: bearAuthInstanceSchema,
            }),
        },
    });

    const store = getStore('bear-auths');

    return {
        version: 1,
        get: (key: typeof bearAuthId) => store.get(key),
        // @ts-expect-error
        set: (key: typeof bearAuthId, value) => store.set(key, value),
        remove: (key: typeof bearAuthId) => store.remove(key),
        clear: () => store.clear(),
    };
}
