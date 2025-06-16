import { afterEach, describe, expect, test } from 'vitest';

import { destroy } from '~/destroy';
import { BearAuthError } from '~/errors';

import { create } from '../create';
import { instances } from '../instances';

afterEach(() => {
    instances.clear();
});

describe('destroy', () => {
    test(`should destroy a specific instance`, async () => {
        const instanceId = 'test-instance';
        const instanceId2 = 'test-instance-2';

        create({ instanceId });
        create({ instanceId: instanceId2 });

        await destroy(instanceId);

        expect(instances.has(instanceId)).toBe(false);
        expect(instances.has(instanceId2)).toBe(true);
        expect(instances.size).toBe(1);
        await expect(async () => await destroy(instanceId)).rejects.toThrowError(BearAuthError);
    });
});
