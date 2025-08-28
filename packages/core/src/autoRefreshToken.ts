import { type BearAuth } from './create.ts';
import { getInstance } from './instances.ts';

export function isExpired(expiration: string | undefined | null) {
    return !expiration || Date.now() >= Date.parse(expiration);
}

export async function startTokenAutoRefresh<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const { flags, logger, hooks, store, alarmManager } = getInstance<AuthInfo>(id);

    if (!flags.autoRefreshAccessTokenEnabled) {
        logger.debug(
            '[startTokenAutoRefresh]',
            `Auto token refresh is disabled. 'authenticate' method must return a 'expiration' and 'refreshToken'.`,
        );
        return;
    }

    await stopTokenAutoRefresh(id);

    const session = store.getSession();

    if (session.status === 'refreshing') {
        return;
    }

    const expiration = session.data?.expiration;

    const expiresIn = isExpired(expiration) ? 0 : Date.parse(expiration!) - Date.now();

    logger.debug('[startTokenAutoRefresh]', `Token will be refreshed in ${expiresIn / 1000}s`);

    async function onAlarm() {
        await hooks.refreshToken!();
    }

    if (expiresIn <= 0) {
        await onAlarm();
    } else {
        getInstance<AuthInfo>(id).refreshTokenTimeout = {
            id: await alarmManager.createAlarm(onAlarm, expiresIn),
            callback: onAlarm,
        };
    }
}

export async function stopTokenAutoRefresh<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const { refreshTokenTimeout, flags, logger, alarmManager } = getInstance<AuthInfo>(id);

    if (refreshTokenTimeout === null || !flags.autoRefreshAccessTokenEnabled) {
        return;
    }

    logger.debug('[stopTokenAutoRefresh]', 'Stopping auto token refresh...');

    await alarmManager.clearAlarm(refreshTokenTimeout.id, refreshTokenTimeout.callback);

    getInstance<AuthInfo>(id).refreshTokenTimeout = null;
}
