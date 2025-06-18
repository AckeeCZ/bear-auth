import type { BearAuth } from '~/create';
import { BearAuthError, isBearAuthError } from '~/errors';
import { getInstance } from '~/instances';
import { retrieveAuthSession } from '~/retrieveAuthSession';
import { getFingerprint } from '~/utils/hash';

export function updateAuthSessionOnTabChange(id: BearAuth<unknown>['id']) {
    if (!('document' in globalThis) || !('visibilityState' in document)) {
        getInstance(id).logger.error(
            new BearAuthError(
                'bear-auth/auth-session-storage-propagation',
                `Document visibility API is not supported in this environment. Can't update auth session on tab change.`,
            ),
        );

        return () => {};
    }

    if (!getInstance(id).storage) {
        throw new BearAuthError(
            'bear-auth/auth-session-storage-propagation',
            `Can't update auth session on tab change. Storage is not available. Call the 'setStorage' method first.`,
        );
    }

    async function documentVisibilityHandler() {
        if (document.visibilityState !== 'visible') {
            return;
        }

        const { logger, storage, state } = getInstance(id);

        try {
            const persistedData = await storage!.get(id);

            const persistedSessionHash = await getFingerprint(persistedData?.data);
            const currentSessionHash = await getFingerprint(state.session.data);

            if (persistedSessionHash === currentSessionHash) {
                logger.debug(
                    `[updateAuthSessionOnTabChange]`,
                    `No need to update auth session. Current session is the same as persisted.`,
                );
                return;
            }

            logger.debug(
                `[updateAuthSessionOnTabChange]`,
                `Persisted session differs from current session. Retrieving session...`,
                {
                    persistedSession: { value: persistedData?.data, hash: persistedSessionHash },
                    currentSession: { value: state.session, hash: currentSessionHash },
                },
            );

            await retrieveAuthSession(id);
        } catch (error) {
            if (isBearAuthError(error)) {
                logger.error(error);
            } else {
                logger.error(
                    new BearAuthError('bear-auth/update-auth-session-failed', (error as Error).message, error),
                );
            }
        }
    }

    document.addEventListener('visibilitychange', documentVisibilityHandler);

    return function cleanup() {
        document.removeEventListener('visibilitychange', documentVisibilityHandler);
    };
}
