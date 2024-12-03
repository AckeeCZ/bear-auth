const errorCodes = [
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
] as const;

type ErrorCodes = typeof errorCodes;

type ErrorCode = ErrorCodes[number];

export class BearAuthError<Code extends ErrorCode> extends Error {
    code: ErrorCode;
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
export const isBearAuthError = (error: unknown): error is BearAuthError<ErrorCode> =>
    error instanceof BearAuthError && error.name === 'BearAuthError';

const errorCodeValues = new Set(errorCodes);

/**
 * Specify BearAuthError with specific error codes you want to handle.
 */
export const isBearAuthErrorWithCodes = <const Codes extends ErrorCode[]>(
    error: unknown,
    codes: Codes,
): error is BearAuthError<Codes[number]> => {
    return isBearAuthError(error) && codes.every(code => errorCodeValues.has(code));
};
