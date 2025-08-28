import { isExpired, startTokenAutoRefresh, stopTokenAutoRefresh } from '../autoRefreshToken.ts';
import { type BearAuth } from '../create.ts';
import { BearAuthError } from '../errors.ts';
import { getInstance } from '../instances.ts';
import { onAuthStateChanged, runOnAuthStateChangedCallbacks } from '../onAuthStateChanged.ts';
import { persistAuthSession } from '../storage.ts';
import {
    setRefreshingSession,
    setUnauthenticatedSession,
    updateSessionAfterRefreshToken,
    type RefreshingSession,
    type Session,
} from '../store/session.ts';
import { registerTask } from '../tasks.ts';
import { MAX_RETRY_COUNT, resolveRetry, type Retry } from './utils/retry.ts';

type AuthData<AuthInfo> = RefreshingSession<AuthInfo>['data'];

export type RefreshTokenHook<AuthInfo> = {
    handler: (authSession: AuthData<AuthInfo>) => Promise<AuthData<AuthInfo>>;
    action: (props?: { forceRefresh?: boolean }) => Promise<Session<AuthInfo>>;
};

/**
 * - Set a function to make API call to your app's backend and fetch fresh access token.
 * - Required when the `authenticaion` method returns `refreshToken` & `expiration` properties.
 * @param id - return value of `create` method
 * @param handler - function to refresh the access token
 * @returns
 */
export function setRefreshTokenHook<AuthInfo, AuthHook extends RefreshTokenHook<AuthInfo> = RefreshTokenHook<AuthInfo>>(
    id: BearAuth<AuthInfo>['id'],
    handler: AuthHook['handler'],
    options?: {
        retry: Retry;
    },
): AuthHook['action'] {
    async function refreshToken(retrievedAuthSession?: AuthData<AuthInfo>, failureCount = 0) {
        const { store, logger, continueWhenOnline, storage } = getInstance<AuthInfo>(id);

        logger.debug('[refreshToken]', 'Refreshing access token...');

        await continueWhenOnline('refreshToken');

        if (!retrievedAuthSession && store.getSession().status !== 'authenticated') {
            throw new BearAuthError(
                'bear-auth/not-authenticated',
                `Can't refresh access token. No auth sesssion active.`,
            );
        }

        await store.setSession(setRefreshingSession);

        await runOnAuthStateChangedCallbacks<AuthInfo>(id);

        await stopTokenAutoRefresh<AuthInfo>(id);

        try {
            const authSession = retrievedAuthSession ?? (store.getSession().data as AuthData<AuthInfo>);

            logger.debug('[refreshToken]', 'Using auth session:', authSession);

            const result = await handler(authSession);

            logger.debug('[refreshToken]', 'Received refresh access token result:', result);

            await store.setSession(session => updateSessionAfterRefreshToken(session, result));

            await persistAuthSession<AuthInfo>(id, store.getSession().data);

            await startTokenAutoRefresh(id);

            logger.debug('[refreshToken]', 'Access token has been successfully refreshed.');

            await runOnAuthStateChangedCallbacks<AuthInfo>(id);

            return store.getSession();
        } catch (error) {
            logger.error(error);

            failureCount++;

            if ((await resolveRetry(options?.retry, error, failureCount)) && failureCount < MAX_RETRY_COUNT) {
                return refreshToken(retrievedAuthSession, failureCount);
            } else {
                await store.setSession(setUnauthenticatedSession);

                await storage?.clear(id);

                await runOnAuthStateChangedCallbacks<AuthInfo>(id);

                throw new BearAuthError('bear-auth/refresh-token-failed', 'Failed to refresh access token', error);
            }
        }
    }

    getInstance<AuthInfo>(id).hooks.refreshToken = refreshToken;

    const triggerRefreshToken: AuthHook['action'] = async options => {
        const { store } = getInstance<AuthInfo>(id);

        const session = store.getSession();

        if (session.status === 'refreshing') {
            await new Promise(resolve => {
                const unsubscribe = onAuthStateChanged(id, session => {
                    if (session.status === 'authenticated') {
                        unsubscribe();
                        resolve(null);
                    }
                });
            });

            return store.getSession();
        }

        if (options?.forceRefresh || isExpired(session.data?.expiration)) {
            return await refreshToken();
        }

        return store.getSession();
    };

    return registerTask<AuthInfo, 'triggerRefreshToken', AuthHook['action']>(
        id,
        'triggerRefreshToken',
        triggerRefreshToken,
    );
}
