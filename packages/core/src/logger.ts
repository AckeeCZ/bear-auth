import { getLogger } from 'loglevel';

import { type BearAuth } from '~/create';

import { getInstance, setInstance } from './instances';

export type LogLevel = 'error' | 'debug' | 'info' | 'silent';

export const defaultLogLevel: LogLevel = 'error';

export function createDefaultLogger(instanceId: BearAuth<unknown>['id'], loglevel: LogLevel) {
    const { error, debug, info, setLevel } = getLogger(instanceId);

    const defaultLogger = {
        error<Args extends unknown[]>(...args: Args) {
            error('[bear-auth]', ...args);
        },
        debug<Args extends unknown[]>(...args: Args) {
            debug('[bear-auth]', ...args);
        },
        info<Args extends unknown[]>(...args: Args) {
            info('[bear-auth]', ...args);
        },
    } as const;

    setLevel(loglevel, true);

    return defaultLogger;
}

export type Logger = ReturnType<typeof createDefaultLogger>;

/**
 * Customize the log level.
 * @param instanceId - return value of `create` method
 */
export function setLogLevel(instanceId: BearAuth<unknown>['id'], level: LogLevel) {
    const instance = getInstance(instanceId);

    instance.loglevel = level;

    console.log('Setting log level', level);

    getLogger(instanceId).setLevel(level, true);

    setInstance(instance);
}

/**
 * Override the default logger.
 * @param instanceId - return value of `create` method
 * @param logger - custom logger
 */
export function setLogger<L extends Logger>(instanceId: BearAuth<unknown>['id'], logger: L) {
    const instance = getInstance(instanceId);

    const { debug, info, error } = logger;

    instance.logger = {
        debug,
        info,
        error,
    } as const;

    setInstance(instance);
}
