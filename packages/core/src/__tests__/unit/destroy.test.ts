import { afterEach, describe, expect, test } from 'vitest';

import { create } from '../../create.ts';
import { destroy } from '../../destroy.ts';
import { BearAuthError } from '../../errors.ts';
import { instances } from '../../instances.ts';

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
