import { BearAuthError } from '~/errors';
import { createDefaultLogger, defaultLogLevel, type Logger, type LogLevel } from '~/logger';
import type { StorageSchema } from '~/storage';
import { createInitialState, type State } from '~/store/state';
import type { AuthSession } from '~/types';

import { defaultContinueWhenOnline } from './network';
import type { OnAuthStateChangedCallback } from './onAuthStateChanged';

export type BearAuth<AuthInfo> = {
    id: string;

    /**
     * @default 'error'
     */
    loglevel: LogLevel;
    logger: Logger;

    hooks: {
        refreshToken: null | ((authSession?: AuthSession<AuthInfo>) => Promise<BearAuth<AuthInfo>>);
        fetchAuthInfo: null | ((authSession?: AuthSession<AuthInfo>) => Promise<BearAuth<AuthInfo>>);
        logout: null | (() => Promise<void>);
    };
    state: State<AuthInfo>;
    flags: {
        autoRefreshAccessTokenEnabled: boolean;
    };

    storage: StorageSchema<AuthInfo> | null;

    /**
     * Internal storage version. If increased, then during `start` method, the storage will be cleared.
     */
    storageVersion: 1;

    onAuthStateChanged: Set<OnAuthStateChangedCallback<AuthInfo>>;

    refreshTokenTimeoutId: null | number;

    continueWhenOnline: () => Promise<void>;
};

export const instances = new Map<string, BearAuth<unknown>>();

export interface CreateProps {
    /**
     * Choose a unique instance ID when creating a multiple BearAuth instances.
     */
    instanceId?: string;
}

export function create({ instanceId = 'bear_auth' }: CreateProps = {}) {
    if (instances.has(instanceId)) {
        throw new BearAuthError(
            'bear-auth/unique-instance',
            `BearAuth with '${instanceId}' ID has been already created. Call 'await detroy(bearAuth: BearAuth)' first.`,
        );
    }

    const instance = {
        id: instanceId,

        loglevel: defaultLogLevel,
        logger: createDefaultLogger(instanceId, defaultLogLevel),

        hooks: {
            refreshToken: null,
            fetchAuthInfo: null,
            logout: null,
        },

        state: createInitialState<unknown>(),

        flags: {
            autoRefreshAccessTokenEnabled: false,
        },

        storage: null,

        storageVersion: 1,

        onAuthStateChanged: new Set<OnAuthStateChangedCallback<unknown>>(),

        refreshTokenTimeoutId: null,

        continueWhenOnline: defaultContinueWhenOnline,
    } as const satisfies BearAuth<unknown>;

    instances.set(instanceId, instance);

    return instance.id;
}

export function getInstance<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    const instance = instances.get(instanceId);

    if (!instance) {
        throw new BearAuthError(
            'bear-auth/unknown-instance',
            `No BearAuth instance found for ${instanceId} ID. Call 'create(instanceId: string)' first.`,
        );
    }

    return instance as BearAuth<AuthInfo>;
}

export function setInstance<AuthState>(bearAuth: BearAuth<AuthState>) {
    instances.set(bearAuth.id, bearAuth as BearAuth<unknown>);
}

/**
 * Get all active BearAuth instance IDs.
 */
export function getCreatedBearAuths() {
    return Array.from(instances.keys());
}
