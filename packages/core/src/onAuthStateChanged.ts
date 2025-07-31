import { type BearAuth } from './create.ts';
import { getInstance } from './instances.ts';
import type { Session } from './store/session.ts';

export type OnAuthStateChangedCallback<AuthInfo> = (session: Session<AuthInfo>) => Promise<void> | void;

/**
 * Register a callback to be called whenever the auth state changes.
 * @param id - return value of `create` method
 * @param callback - function to be called when the auth state changes
 * @returns a function to unsubscribe the callback
 */
export function onAuthStateChanged<AuthInfo>(
    id: BearAuth<AuthInfo>['id'],
    callback: OnAuthStateChangedCallback<AuthInfo>,
) {
    const { logger, onAuthStateChanged, store } = getInstance<AuthInfo>(id);

    logger.debug('[onAuthStateChanged]', 'Subscribing...', callback);

    onAuthStateChanged.callbacks.add(callback);

    const session = store.getSession();

    callback(session);

    logger.debug('[onAuthStateChanged]', 'Callback called immediately with current session:', session);

    return function unsubscribe() {
        logger.debug('[onAuthStateChanged]', 'Unsubscribing...', callback);
        onAuthStateChanged.callbacks.delete(callback);
    };
}

export async function runOnAuthStateChangedCallbacks<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const { onAuthStateChanged, store, logger } = getInstance<AuthInfo>(id);
    const prevSession = onAuthStateChanged.prevSession;
    const session = store.getSession();

    if (prevSession?.status === session.status && JSON.stringify(prevSession.data) === JSON.stringify(session.data)) {
        logger.debug('[onAuthStateChanged]', 'Session is the same. Skipping...');
        return;
    }

    const tasks = Array.from(onAuthStateChanged.callbacks.values()).map(callback => callback(session));

    logger.debug('[onAuthStateChanged]', 'All callbacks called with session:', session);

    await Promise.allSettled(tasks);

    onAuthStateChanged.prevSession = session;
}
