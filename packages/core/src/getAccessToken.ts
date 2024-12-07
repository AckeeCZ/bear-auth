import { isExpired } from '~/autoRefreshToken';
import { type BearAuth } from '~/create';

import { getInstance } from './instances';
import { onAuthStateChanged } from './onAuthStateChanged';

async function onResolveAuthState(instanceId: BearAuth<unknown>['id']) {
    let unsubscribe = () => {};

    await new Promise<void>(resolve => {
        unsubscribe = onAuthStateChanged(instanceId, session => {
            if (session.status !== 'loading') {
                resolve();
            }
        });
    });

    unsubscribe();
}

/**
 * Get the access token:
 * 1. If session is 'loading', wait for it to resolve.
 * 2. If session is 'unauthenticated', return null.
 * 3. If session is 'authenticated', check if the token is expired.
 * 4. If token is expired and refresh token is available, refresh the token.
 * 5. Return the access token.
 * @param instanceId - return value of `create` method
 */
export async function getAccessToken(
    instanceId: BearAuth<unknown>['id'],
    { forceRefresh = false }: { forceRefresh?: boolean } = {},
) {
    let instance = getInstance(instanceId);

    if (instance.state.session.status === 'loading') {
        await onResolveAuthState(instanceId);
    }

    instance = getInstance(instanceId);

    const { status, data } = instance.state.session;

    if (status === 'unauthenticated') {
        return null;
    }

    if (status === 'authenticated') {
        if (isExpired(data.expiration) && !data.refreshToken) {
            return null;
        }

        if ((isExpired(data.expiration) || forceRefresh) && instance.hooks.refreshToken) {
            instance = await instance.hooks.refreshToken();
        }

        return instance.state.session.data!.accessToken;
    }

    return null;
}
