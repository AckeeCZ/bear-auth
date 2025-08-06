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

    const { expiration } = store.getSession().data!;

    const expiresIn = isExpired(expiration) ? 0 : Date.parse(expiration!) - Date.now();

    logger.debug('[startTokenAutoRefresh]', `Token will be refreshed in ${expiresIn / 1000}s`);

    getInstance<AuthInfo>(id).refreshTokenTimeoutId = await alarmManager.createAlarm(async () => {
        await hooks.refreshToken!();
    }, expiresIn);
}

export async function stopTokenAutoRefresh<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const { refreshTokenTimeoutId, flags, logger, alarmManager } = getInstance<AuthInfo>(id);

    if (refreshTokenTimeoutId === null || !flags.autoRefreshAccessTokenEnabled) {
        return;
    }

    logger.debug('[stopTokenAutoRefresh]', 'Stopping auto token refresh...');

    await alarmManager.clearAlarm(refreshTokenTimeoutId);

    getInstance<AuthInfo>(id).refreshTokenTimeoutId = null;
}
