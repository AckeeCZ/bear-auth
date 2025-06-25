import { describe, expect, test, vi } from 'vitest';

import { create } from '../../create.ts';
import { destroy } from '../../destroy.ts';
import { instances } from '../../instances.ts';
import { defaultLogLevel, setLogger, setLogLevel, type Logger } from '../../logger.ts';

describe('logger', () => {
    test('should set log level', async () => {
        const id = 'test-instance-id';
        create({ id });

        expect(instances.get(id)?.loglevel).toBe(defaultLogLevel);

        setLogLevel(id, 'debug');

        expect(instances.get(id)?.loglevel).toBe('debug');

        await destroy(id);
    });

    test('should set custom logger', async () => {
        const id = 'test-instance-id';
        create({ id });

        const error = vi.fn();
        const debug = vi.fn();
        const info = vi.fn();

        const customLogger = {
            error(...args) {
                error(...args);
            },
            debug(...args) {
                debug(...args);
            },
            info(...args) {
                info(...args);
            },
        } satisfies Logger;

        setLogger(id, customLogger);

        const instance = instances.get(id);
        expect(instance?.logger).toEqual(customLogger);
        expect(instance?.flags.customLogger).toBe(true);
        expect(instance?.loglevel).toBe(null);

        expect(() => setLogLevel(id, 'debug')).toThrowErrorMatchingSnapshot(
            `cannot set log level when using custom logger`,
        );
    });
});
