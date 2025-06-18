import type { BearAuth } from '~/create';
import { getInstance } from '~/instances';

import { createAuthSessionBroadcastChannel } from './createAuthSessionBroadcastChannel';
import { updateAuthSessionOnTabChange } from './updateAuthSessionOnTabChange';

export type AuthSessionPropagationType = 'lazy' | 'sync' | 'none';

/**
 * Let's consider a user opens your app in two different tabs.
 * How should the authentication session be handled in this case?
 * Choose one of the following auth session propagation strategies:
 * i.e. how the auth session should be propagated across different clients.
 *
 * 1. lazy – the auth session is synchronized on a tab focus through persisted storage shared by all clients
 * 2. sync (default) - the auth session is synchronized immediately across all clients using BroadcastChannel
 * 3. none - the auth session is not updated in different clients (tabs) unless the page is hard-reloaded or the user logs in again.
 */
export function setAuthSessionPropagation(id: BearAuth<unknown>['id'], type: AuthSessionPropagationType) {
    const instance = getInstance(id);

    instance.authSessionPropagation?.cleanUp();
    instance.authSessionPropagation = null;

    switch (type) {
        case 'sync':
            instance.authSessionPropagation = {
                type: 'sync',
                cleanUp: createAuthSessionBroadcastChannel(id),
            };
            break;

        case 'lazy':
            instance.authSessionPropagation = {
                type: 'lazy',
                cleanUp: updateAuthSessionOnTabChange(id),
            };
            break;

        case 'none':
            instance.authSessionPropagation = null;
            break;
    }
}

export function setDefaultAuthSessionPropagation(id: BearAuth<unknown>['id']) {
    const instance = getInstance(id);

    if ('BroadcastChannel' in globalThis) {
        instance.authSessionPropagation = {
            type: 'sync',
            cleanUp: createAuthSessionBroadcastChannel(id),
        };
    } else if ('document' in globalThis && 'visibilityState' in document) {
        instance.authSessionPropagation = {
            type: 'lazy',
            cleanUp: updateAuthSessionOnTabChange(id),
        };
    } else {
        instance.authSessionPropagation = null;
    }
}
