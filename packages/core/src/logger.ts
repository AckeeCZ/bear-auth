import { getLogger } from 'loglevel';

import { type BearAuth } from '~/create';

import { BearAuthError } from './errors';
import { getInstance } from './instances';

export type LogLevel = 'error' | 'debug' | 'info' | 'silent';

export const defaultLogLevel: LogLevel = 'error';

export function createDefaultLogger(id: BearAuth<unknown>['id'], loglevel: LogLevel) {
    const { error, debug, info, setLevel } = getLogger(id);

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

    setLevel(loglevel);

    return defaultLogger;
}

export type Logger = ReturnType<typeof createDefaultLogger>;

/**
 * Customize the log level.
 * @param id - return value of `create` method
 */
export function setLogLevel(id: BearAuth<unknown>['id'], level: LogLevel) {
    const instance = getInstance(id);

    if (instance.flags.customLogger) {
        throw new BearAuthError('bear-auth/log-level', 'Cannot set log level when using custom logger.');
    }

    instance.loglevel = level;

    instance.logger.debug('[setLogLevel]', 'Setting log level', level);

    getLogger(id).setLevel(level);
}

/**
 * Override the default logger.
 * @param id - return value of `create` method
 * @param logger - custom logger
 */
export function setLogger<L extends Logger>(id: BearAuth<unknown>['id'], logger: L) {
    const instance = getInstance(id);

    const { debug, info, error } = logger;

    instance.logger = {
        debug,
        info,
        error,
    } as const;

    instance.flags.customLogger = true;
    instance.loglevel = null;

    debug('setLogger', 'Custom logger is set. The setLogLevel method will not do anything.');
}
