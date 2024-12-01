import { type BearAuth } from '~/create';
import { BearAuthError } from '~/errors';

// Buffer to account for network latency
const REFRESH_TOKEN_EXPIRATION_BUFFER = 5 * 1000; // milliseconds

const MIN_EXPIRES_IN = 10 * 1000; // milliseconds

/**
 * Convert the number of seconds until the token expires to an expiration timestamp.
 * @param expiresIn number of ms until the token expires
 * @returns
 */
export function convertExpiresInToExpiration(expiresIn: number): string | null {
    const expiresInWithBuffer = expiresIn - REFRESH_TOKEN_EXPIRATION_BUFFER;

    return expiresIn < MIN_EXPIRES_IN ? null : new Date(Date.now() + expiresInWithBuffer).toISOString();
}

export function isExpired(expiration?: string | null): boolean {
    if (!expiration) {
        return true;
    }

    const expiresIn = new Date(expiration).getTime() - Date.now();

    return expiresIn < MIN_EXPIRES_IN;
}

/**
 *
 * @param expiresIn in milliseconds
 */
export function validateExpiresIn(expiresIn?: number | null) {
    if (!expiresIn || expiresIn <= MIN_EXPIRES_IN) {
        throw new BearAuthError(
            'bear-auth/invalid-expires-in',
            `ExpiresIn must be greater than ${MIN_EXPIRES_IN / 1000}s. Received: ${expiresIn}${Number.isInteger(expiresIn) ? 'ms' : ''}`,
        );
    }
}

export function startTokenAutoRefresh<AuthInfo>(instance: BearAuth<AuthInfo>) {
    if (!instance.flags.autoRefreshAccessTokenEnabled) {
        instance.logger.debug(
            'startTokenAutoRefresh',
            `Auto token refresh is disabled. 'authenticate' method must return a 'expiresIn' and 'refreshToken'.`,
        );
        return instance;
    }

    const { expiration } = instance.state.session.data!;

    const expiresIn = new Date(expiration as string).getTime() - Date.now();

    validateExpiresIn(expiresIn);

    instance.logger.debug('startTokenAutoRefresh', `Token will be refreshed in ${expiresIn / 1000}s`);

    const refreshTokenTimeoutId = setTimeout(() => {
        instance.hooks.refreshToken!();
    }, expiresIn);

    instance.refreshTokenTimeoutId = refreshTokenTimeoutId;

    return instance;
}

export function stopTokenAutoRefresh<AuthInfo>(instance: BearAuth<AuthInfo>) {
    if (instance.refreshTokenTimeoutId === null || !instance.flags.autoRefreshAccessTokenEnabled) {
        return instance;
    }

    instance.logger.debug('stopTokenAutoRefresh', 'Stopping auto token refresh...');

    clearTimeout(instance.refreshTokenTimeoutId);
    instance.refreshTokenTimeoutId = null;

    return instance;
}
