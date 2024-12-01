import { type StorageSchema } from '@bear-auth/core';
import { initIDB } from 'idb-stores';
import { z, ZodType } from 'zod';

export interface CreateStorageProps<AuthInfo> {
    /**
     * Bear auth instance ID (return value of the `create` method)
     */
    bearAuthId: string;

    /**
     * Define Zod schema for the `authInfo` field of the session.data object.
     */
    authInfo: ZodType<AuthInfo>;

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
export function createIndexedDBStorage<AuthInfo>({ bearAuthId, authInfo, db }: CreateStorageProps<AuthInfo>) {
    const authSessionSchema = z.object({
        accessToken: z.string(),
        expiration: z.string().nullable(),
        refreshToken: z.string().nullable(),
        authInfo,
    });

    type AuthSession = z.infer<typeof authSessionSchema>;

    const bearAuthInstanceSchema = z.object({
        version: z.number(),
        data: authSessionSchema,
    });

    const getStore = initIDB({
        database: db ?? {
            version: 1,
            name: 'bear-auth',
        },
        storeSchemas: {
            'bear-auths': z.object({
                [bearAuthId]: bearAuthInstanceSchema.optional(),
            }),
        },
    });

    const store = getStore('bear-auths');

    return {
        version: 1,
        ...store,
        // @ts-expect-error TODO:
        get: key => store.get(key),
        // @ts-expect-error TODO:
        set: (key, value) => store.set(key, value),
        remove: key => store.remove(key),
        clear: () => store.clear(),
    } satisfies StorageSchema<AuthInfo & AuthSession['authInfo']>;
}
