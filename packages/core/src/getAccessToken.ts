import { isExpired } from '~/autoRefreshToken';
import { type BearAuth } from '~/create';

import { getInstance } from './instances';
import { onAuthStateChanged } from './onAuthStateChanged';

async function onResolveAuthState(instanceId: BearAuth<unknown>['id']) {
    let unsubscribe = () => {};

    await new Promise<void>(resolve => {
        unsubscribe = onAuthStateChanged(instanceId, session => {
            if (session.status === 'authenticated' || session.status === 'unauthenticated') {
                resolve();
            }
        });
    });

    unsubscribe();
}

/**
 * Get the access token:
 * 1. If session is `refreshing` or `retrieving`, wait for it to resolve.
 * 2. If session is `unauthenticated` or 'signing-out`, return null.
 * 3. If session is `authenticated`, check if the token is expired.
 * 4. If token is expired and refresh token is available, refresh the token.
 * 5. Return the access token.
 * @param instanceId - return value of `create` method
 */
export async function getAccessToken(
    instanceId: BearAuth<unknown>['id'],
    { forceRefresh = false }: { forceRefresh?: boolean } = {},
) {
    const { logger, state, hooks } = getInstance(instanceId);

    if (state.session.status === 'signing-out') {
        logger.debug('[getAccessToken]', 'Just signing-out. Access token is not available anymore.');
        return null;
    }

    if (state.session.status === 'refreshing' || state.session.status === 'retrieving') {
        logger.debug('[getAccessToken]', `Waiting for '${state.session.status}' status to resolve...`);
        await onResolveAuthState(instanceId);
    }

    const { status, data } = state.session;

    logger.debug('[getAccessToken]', 'Session status:', state.session);

    if (status === 'unauthenticated') {
        return null;
    }

    if (status === 'authenticated') {
        if (isExpired(data.expiration) && !data.refreshToken) {
            logger.debug('[getAccessToken]', 'Access token expired and no refresh token available. Returning null.');
            return null;
        }

        if ((isExpired(data.expiration) || forceRefresh) && hooks.refreshToken) {
            logger.debug(
                '[getAccessToken]',
                'Access token expired or force refresh enabled. Refreshing access token...',
            );

            await hooks.refreshToken();

            logger.debug('[getAccessToken]', 'Access token refreshed.', state.session);
        }

        logger.debug('[getAccessToken]', 'Returning access token:', state.session.data!.accessToken);

        return state.session.data!.accessToken;
    }

    logger.debug('[getAccessToken]', 'Session status is not recognized. Returning null.');

    return null;
}
