import { afterEach, describe, expect, test } from 'vitest';

import { BearAuthError } from '~/errors';

import { create } from '../create';
import { instances } from '../instances';

afterEach(() => {
    instances.clear();
});

describe('create', () => {
    test(`should create a new instance`, () => {
        const instanceId = 'test-instance';
        const instance = create({ instanceId });

        expect(instance).toBe(instanceId);
        expect(instances.has(instanceId)).toBe(true);
        expect(instances.size).toBe(1);
    });

    test('should throw BearAuthError if instance already exists', () => {
        const instanceId = 'test-instance';
        create({ instanceId });

        expect(() => create({ instanceId })).toThrowError(BearAuthError);
        expect(instances.size).toBe(1);
    });
});

describe(`getCreatedBearAuths`, () => {
    test(`should return all created BearAuth instances`, () => {
        const instanceId1 = 'test-instance-1';
        const instanceId2 = 'test-instance-2';

        create({ instanceId: instanceId1 });
        create({ instanceId: instanceId2 });

        const createdInstances = Array.from(instances.keys());

        expect(createdInstances).toContain(instanceId1);
        expect(createdInstances).toContain(instanceId2);

        expect(createdInstances.length).toBe(2);
        expect(instances.size).toBe(2);
    });
});
