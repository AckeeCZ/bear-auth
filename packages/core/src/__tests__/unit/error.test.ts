import { afterEach, describe, expect, test } from 'vitest';

import { BearAuthError, isBearAuthError, isBearAuthErrorWithCodes } from '~/errors';

import { instances } from '../../instances';

afterEach(() => {
    instances.clear();
});

describe('isBearAuthError', () => {
    test(`recognizes BearAuthError`, () => {
        const error = new BearAuthError('bear-auth/fetch-auth-data-failed', 'Failed to fetch auth data');
        expect(isBearAuthError(error)).toBe(true);
        expect(isBearAuthError(new Error('non bear auth error'))).toBe(false);
    });
});

describe('isBearAuthErrorWithCodes', () => {
    test(`recognizes BearAuthError with specific codes`, () => {
        const error = new BearAuthError('bear-auth/fetch-auth-data-failed', 'Failed to fetch auth data');

        expect(isBearAuthErrorWithCodes(error, ['bear-auth/fetch-auth-data-failed'])).toBe(true);
        // @ts-expect-error
        expect(isBearAuthErrorWithCodes(error, ['bear-auth/another-error'])).toBe(false);

        expect(isBearAuthErrorWithCodes(new Error('non bear auth error'), ['bear-auth/fetch-auth-data-failed'])).toBe(
            false,
        );
    });
});
