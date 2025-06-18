import type { BearAuth } from './create';
import { BearAuthError } from './errors';

export const instances = new Map<string, BearAuth<unknown>>();

export function getInstance<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const instance = instances.get(id);

    if (!instance) {
        throw new BearAuthError(
            'bear-auth/unknown-instance',
            `No BearAuth instance found for ${id} ID. Call 'create(id: string)' first.`,
        );
    }

    return instance as BearAuth<AuthInfo>;
}

/**
 * Get all active BearAuth instance IDs.
 */
export function getCreatedBearAuths() {
    return Array.from(instances.keys());
}
