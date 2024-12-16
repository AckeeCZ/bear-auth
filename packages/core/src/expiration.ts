import { BearAuthError } from './errors';

/**
 * Convert the `expiresIn` value in ms to a ISO timestamp representing the expiration time.
 */
export function getExpirationTimestamp(expiresIn: number): string {
    return new Date(Date.now() + expiresIn).toISOString();
}

/**
 * Buffer to account for network latency
 */
const REFRESH_TOKEN_EXPIRATION_BUFFER = 5_000; // 5s

const MIN_EXPIRES_IN = 10_000; // 10s

/**
 * Expiration timestamp must be at least 10s (refering to the `MIN_EXPIRES_IN` constant) in the future.
 */
function isValidExpirationTimestamp(expiration: string | undefined | null): expiration is string {
    if (!expiration) {
        return false;
    }

    return Date.now() + MIN_EXPIRES_IN <= Date.parse(expiration);
}

/**
 * Decrease the expiration timestamp by `REFRESH_TOKEN_EXPIRATION_BUFFER` ms (i.e. to account for network latency during access token refresh).
 * @param expiration expiration timestamp in ISO format
 * @returns decreased expiration timestamp in ISO format or `null` if the expiration timestamp too low or is invalid
 */
function decreaseExpirationTimestamp(expiration: string): string | null {
    const decreasedExpiration = new Date(Date.parse(expiration) - REFRESH_TOKEN_EXPIRATION_BUFFER).toISOString();

    return isValidExpirationTimestamp(decreasedExpiration) ? decreasedExpiration : null;
}

/**
 * If expiration timestamp provided, it must be at least 10s in the future (referring to the `MIN_EXPIRES_IN` constant) or the BearAuthError<'bear-auth/invalid-expires-in'> is thrown.
 * If it's provided and valid, the expiration timestamp is decreased by `REFRESH_TOKEN_EXPIRATION_BUFFER` ms.
 * If not provided, `null` is returned.
 * @param expiration
 * @returns
 */
export function getExpirationTimestampWithBuffer(expiration: string | undefined | null) {
    const isValid = isValidExpirationTimestamp(expiration);

    if (expiration && !isValid) {
        throw new BearAuthError(
            'bear-auth/invalid-expires-in',
            `Expiration timestamp must be greater than '${new Date(Date.now() + MIN_EXPIRES_IN).toISOString()}', received: '${expiration}'.}`,
        );
    }

    return isValidExpirationTimestamp(expiration) ? decreaseExpirationTimestamp(expiration) : null;
}
