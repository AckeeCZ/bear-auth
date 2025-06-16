import { describe, expect, test } from 'vitest';

import { BearAuthError } from '~/errors';

import { getExpirationTimestampWithBuffer } from '../expiration';

describe('getExpirationTimestampWithBuffer', () => {
    test(`should throw BearAuthError for expired tokens`, () => {
        expect(() => getExpirationTimestampWithBuffer(new Date(Date.now()).toISOString())).toThrowError(BearAuthError);
    });

    test(`should return null for null or undefined expiration`, () => {
        expect(getExpirationTimestampWithBuffer(undefined)).toBe(null);
        expect(getExpirationTimestampWithBuffer(null)).toBe(null);
    });

    test(`should return expiration timestamp with buffer`, () => {
        expect(() => getExpirationTimestampWithBuffer(new Date(Date.now() + 10_000).toISOString())).not.toThrowError(
            BearAuthError,
        );
    });
});
