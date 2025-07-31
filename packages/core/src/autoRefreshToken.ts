import { type BearAuth } from './create.ts';
import { getInstance } from './instances.ts';

export function isExpired(expiration: string | undefined | null) {
    return !expiration || Date.now() >= Date.parse(expiration);
}

export function startTokenAutoRefresh<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const { flags, logger, hooks, store } = getInstance<AuthInfo>(id);

    if (!flags.autoRefreshAccessTokenEnabled) {
        logger.debug(
            '[startTokenAutoRefresh]',
            `Auto token refresh is disabled. 'authenticate' method must return a 'expiration' and 'refreshToken'.`,
        );
        return;
    }

    stopTokenAutoRefresh(id);

    const { expiration } = store.getSession().data!;

    const expiresIn = isExpired(expiration) ? 0 : Date.parse(expiration!) - Date.now();

    logger.debug('[startTokenAutoRefresh]', `Token will be refreshed in ${expiresIn / 1000}s`);

    getInstance<AuthInfo>(id).refreshTokenTimeoutId = globalThis.setTimeout(() => {
        hooks.refreshToken!();
    }, expiresIn);
}

export function stopTokenAutoRefresh<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const { refreshTokenTimeoutId, flags, logger } = getInstance<AuthInfo>(id);

    if (refreshTokenTimeoutId === null || !flags.autoRefreshAccessTokenEnabled) {
        return;
    }

    logger.debug('[stopTokenAutoRefresh]', 'Stopping auto token refresh...');

    clearTimeout(refreshTokenTimeoutId);

    getInstance<AuthInfo>(id).refreshTokenTimeoutId = null;
}
