export const bearAuthErrorCodes = [
    'bear-auth/unique-instance',
    'bear-auth/not-implemented',
    'bear-auth/unknown-instance',
    'bear-auth/unset-hook',
    'bear-auth/not-authenticated',
    'bear-auth/refresh-token-failed',
    'bear-auth/fetch-auth-data-failed',
    'bear-auth/logout-failed',
    'bear-auth/unknown-hook',
    'bear-auth/retrieve-auth-session-failed',
    'bear-auth/invalid-expires-in',
    'bear-auth/log-level',
    'bear-auth/auth-session-storage-propagation',
    'bear-auth/update-auth-session-failed',
    'bear-auth/auth-session-broadcast',
] as const;

type ErrorCodes = typeof bearAuthErrorCodes;

export type BearAuthErrorCode = ErrorCodes[number];

export class BearAuthError<Code extends BearAuthErrorCode> extends Error {
    code: BearAuthErrorCode;
    originalError?: unknown;

    constructor(code: Code, message: string, error?: unknown) {
        super(message);
        this.name = 'BearAuthError';
        this.code = code;
        this.originalError = error;
    }
}

/**
 * A TS guard function to recognize BearAuthError.
 */
export const isBearAuthError = (error: unknown): error is BearAuthError<BearAuthErrorCode> =>
    error instanceof BearAuthError && error.name === 'BearAuthError';

const errorCodeValues = new Set(bearAuthErrorCodes);

/**
 * Specify BearAuthError with specific error codes you want to handle.
 */
export const isBearAuthErrorWithCodes = <const Codes extends BearAuthErrorCode[]>(
    error: unknown,
    codes: Codes,
): error is BearAuthError<Codes[number]> => {
    return isBearAuthError(error) && codes.every(code => errorCodeValues.has(code));
};
