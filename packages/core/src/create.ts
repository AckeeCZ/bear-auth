import { BearAuthError } from '~/errors';
import { createDefaultLogger, defaultLogLevel, type Logger, type LogLevel } from '~/logger';
import type { StorageSchema } from '~/storage';
import { createInitialState, type State } from '~/store/state';

import { instances } from './instances';
import { defaultContinueWhenOnline } from './network';
import type { OnAuthStateChangedCallback } from './onAuthStateChanged';
import type { AuthenticatedSession, RefreshingSession, Session } from './store/session';

export type BearAuth<AuthInfo> = {
    id: string;

    /**
     * @default 'error'
     */
    loglevel: LogLevel;
    logger: Logger;

    hooks: {
        refreshToken: null | ((authSession?: RefreshingSession<AuthInfo>['data']) => Promise<Session<AuthInfo>>);
        fetchAuthInfo: null | ((authSession?: AuthenticatedSession<AuthInfo>['data']) => Promise<Session<AuthInfo>>);
        logout: null | (() => Promise<void>);
    };
    state: State<AuthInfo>;
    flags: {
        autoRefreshAccessTokenEnabled: boolean;
        customLogger: boolean;
    };

    storage: StorageSchema<AuthInfo> | null;

    /**
     * Internal storage version. If increased, then during `start` method, the storage will be cleared.
     */
    storageVersion: 1;

    onAuthStateChanged: Set<OnAuthStateChangedCallback<AuthInfo>>;

    refreshTokenTimeoutId: null | (number | NodeJS.Timeout);

    continueWhenOnline: () => Promise<void>;
};

export interface CreateProps {
    /**
     * Choose a unique instance ID when creating a multiple BearAuth instances.
     */
    instanceId?: string;
}

/**
 * Initialize BearAuth instance. Can't be called multiple times with the same instance ID (Call `destroy` first).
 * @returns a string reference to the created BearAuth instance.
 */
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
            customLogger: false,
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
