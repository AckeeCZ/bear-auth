import { isExpired } from '~/autoRefreshToken';
import { getInstance, type BearAuth } from '~/create';

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
