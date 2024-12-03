import type { BearAuth } from './create';
import { BearAuthError } from './errors';

export const instances = new Map<string, BearAuth<unknown>>();

export function getInstance<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    const instance = instances.get(instanceId);

    if (!instance) {
        throw new BearAuthError(
            'bear-auth/unknown-instance',
            `No BearAuth instance found for ${instanceId} ID. Call 'create(instanceId: string)' first.`,
        );
    }

    return instance as BearAuth<AuthInfo>;
}

export function setInstance<AuthState>(bearAuth: BearAuth<AuthState>) {
    instances.set(bearAuth.id, bearAuth as BearAuth<unknown>);
}

/**
 * Get all active BearAuth instance IDs.
 */
export function getCreatedBearAuths() {
    return Array.from(instances.keys());
}
