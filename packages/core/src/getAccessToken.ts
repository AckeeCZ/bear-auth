import { isExpired } from './autoRefreshToken.ts';
import { type BearAuth } from './create.ts';
import { getInstance } from './instances.ts';
import { onAuthStateChanged } from './onAuthStateChanged.ts';

async function onResolveAuthState(id: BearAuth<unknown>['id']) {
    let unsubscribe = () => {};

    await new Promise<void>(resolve => {
        unsubscribe = onAuthStateChanged(id, session => {
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
 * @param id - return value of `create` method
 */
export async function getAccessToken(
    id: BearAuth<unknown>['id'],
    { forceRefresh = false }: { forceRefresh?: boolean } = {},
) {
    const { logger, state, hooks } = getInstance(id);

    if (state.session.status === 'signing-out') {
        logger.debug('[getAccessToken]', 'Just signing-out. Access token is not available anymore.');
        return null;
    }

    if (state.session.status === 'refreshing' || state.session.status === 'retrieving') {
        logger.debug('[getAccessToken]', `Waiting for '${state.session.status}' status to resolve...`);
        await onResolveAuthState(id);
    }

    const { status, data } = getInstance(id).state.session;

    logger.debug('[getAccessToken]', 'Session status:', state.session);

    if (status === 'unauthenticated') {
        return null;
    }

    if (status === 'authenticated') {
        if (!data.expiration && !data.refreshToken) {
            logger.debug(
                '[getAccessToken]',
                'No expiration, nor refreshToken set. Returning access token without checks.',
            );
            return data.accessToken;
        }

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

            logger.debug('[getAccessToken]', 'Access token refreshed.', getInstance(id).state.session);
        }

        const accessToken = getInstance(id).state.session.data?.accessToken;

        logger.debug('[getAccessToken]', 'Returning access token:', accessToken);

        return accessToken;
    }

    logger.debug('[getAccessToken]', 'Session status is not recognized. Returning null.');

    return null;
}
