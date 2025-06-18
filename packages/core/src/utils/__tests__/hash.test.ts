import { describe, expect, test } from 'vitest';

import { getFingerprint } from '../hash';

describe('getFingerprint', () => {
    test('should return the same hash for the same data', async () => {
        const data = { key: 'value' };
        const hash1 = await getFingerprint(data);
        const hash2 = await getFingerprint(data);

        expect(hash1).toBe(hash2);
    });
});
