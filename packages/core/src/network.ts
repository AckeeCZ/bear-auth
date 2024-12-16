import { type BearAuth } from './create';
import { getInstance, setInstance } from './instances';

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
    instanceId: BearAuth<unknown>['id'],
    continueWhenOnline: typeof defaultContinueWhenOnline,
): void {
    const instance = getInstance(instanceId);

    instance.continueWhenOnline = async () => {
        instance.logger.debug(
            '[resolveWhenOnline]',
            'Will continue only if the network is online or wait once it is online again...',
        );
        await continueWhenOnline();
        instance.logger.debug('[resolveWhenOnline]', 'Network is online.');
    };

    setInstance(instance);
}
