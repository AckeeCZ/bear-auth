import { afterEach, describe, expect, test } from 'vitest';

import { BearAuthError } from '~/errors';

import { create } from '../../create';
import { instances } from '../../instances';

afterEach(() => {
    instances.clear();
});

describe('create', () => {
    test(`should create a new instance`, () => {
        const id = 'test-instance';
        const instance = create({ id: id });

        expect(instance).toBe(id);
        expect(instances.has(id)).toBe(true);
        expect(instances.size).toBe(1);
    });

    test('should throw BearAuthError if instance already exists', () => {
        const id = 'test-instance';
        create({ id: id });

        expect(() => create({ id: id })).toThrowError(BearAuthError);
        expect(instances.size).toBe(1);
    });
});

describe(`getCreatedBearAuths`, () => {
    test(`should return all created BearAuth instances`, () => {
        const id1 = 'test-instance-1';
        const id2 = 'test-instance-2';

        create({ id: id1 });
        create({ id: id2 });

        const createdInstances = Array.from(instances.keys());

        expect(createdInstances).toContain(id1);
        expect(createdInstances).toContain(id2);

        expect(createdInstances.length).toBe(2);
        expect(instances.size).toBe(2);
    });
});
