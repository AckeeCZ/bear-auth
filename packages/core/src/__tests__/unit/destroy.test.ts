import { afterEach, describe, expect, test } from 'vitest';

import { destroy } from '~/destroy';
import { BearAuthError } from '~/errors';

import { create } from '../../create';
import { instances } from '../../instances';

afterEach(() => {
    instances.clear();
});

describe('destroy', () => {
    test(`should destroy a specific instance`, async () => {
        const id = 'test-instance';
        const instanceId2 = 'test-instance-2';

        create({ id });
        create({ id: instanceId2 });

        await destroy(id);

        expect(instances.has(id)).toBe(false);
        expect(instances.has(instanceId2)).toBe(true);
        expect(instances.size).toBe(1);
        await expect(async () => await destroy(id)).rejects.toThrowError(BearAuthError);
    });
});
