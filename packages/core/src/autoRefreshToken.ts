import { type BearAuth } from '~/create';

import { getInstance } from './instances';

export function isExpired(expiration: string | undefined | null) {
    return !expiration || Date.now() >= Date.parse(expiration);
}

export function startTokenAutoRefresh<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const instance = getInstance<AuthInfo>(id);

    if (!instance.flags.autoRefreshAccessTokenEnabled) {
        instance.logger.debug(
            '[startTokenAutoRefresh]',
            `Auto token refresh is disabled. 'authenticate' method must return a 'expiration' and 'refreshToken'.`,
        );
        return instance;
    }

    stopTokenAutoRefresh(id);

    const { expiration } = instance.state.session.data!;

    const expiresIn = isExpired(expiration) ? 0 : Date.parse(expiration!) - Date.now();

    instance.logger.debug('[startTokenAutoRefresh]', `Token will be refreshed in ${expiresIn / 1000}s`);

    const refreshTokenTimeoutId = globalThis.setTimeout(() => {
        instance.hooks.refreshToken!();
    }, expiresIn);

    instance.refreshTokenTimeoutId = refreshTokenTimeoutId;
}

export function stopTokenAutoRefresh<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const instance = getInstance<AuthInfo>(id);

    if (instance.refreshTokenTimeoutId === null || !instance.flags.autoRefreshAccessTokenEnabled) {
        return;
    }

    instance.logger.debug('[stopTokenAutoRefresh]', 'Stopping auto token refresh...');

    clearTimeout(instance.refreshTokenTimeoutId);
    instance.refreshTokenTimeoutId = null;
}
