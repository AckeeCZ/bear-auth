import { type BearAuth } from './create.ts';
import { getInstance } from './instances.ts';

type NetworkStatus = 'online' | 'offline';

function getNetworkStatus(): NetworkStatus {
    return navigator.onLine ? 'online' : 'offline';
}

export async function defaultContinueWhenOnline() {
    if (getNetworkStatus() === 'online') {
        return;
    }

    return new Promise<void>(resolve => {
        window.addEventListener('online', () => {
            resolve();
        });
    });
}

/**
 * Set custom method that returns a promise that resolves when the network is online.
 * If the network is offline, it waits for the network to come back online.
 */
export function setContinueWhenOnline(
    id: BearAuth<unknown>['id'],
    continueWhenOnline: BearAuth<unknown>['continueWhenOnline'],
): void {
    const instance = getInstance(id);

    instance.continueWhenOnline = async taskName => {
        instance.logger.debug('[resolveWhenOnline]', `${taskName} task will proceed if the network is online...`);
        await continueWhenOnline(taskName);
        instance.logger.debug('[resolveWhenOnline]', `${taskName} task will proceed, network is online. 🟢`);
    };
}
