import { name, version } from '~/../package.json';
import { authenticate } from '~/authenticate';
import type { BearAuth } from '~/create';
import { BearAuthError, isBearAuthError } from '~/errors';
import { setLogoutHook } from '~/hooks/setLogoutHook';
import { getInstance } from '~/instances';
import { onAuthStateChanged } from '~/onAuthStateChanged';
import type { Session } from '~/store/session';
import { getFingerprint } from '~/utils/hash';

type AuthSessionChange = {
    type: 'AUTH_SESSION_CHANGE';
    clientId: string;
    session: Session<unknown>;
};

export function createAuthSessionBroadcastChannel(id: BearAuth<unknown>['id']) {
    if (!('BroadcastChannel' in globalThis)) {
        getInstance(id).logger.error(
            new BearAuthError(
                'bear-auth/auth-session-broadcast',
                'BroadcastChannel is not supported in this environment.',
            ),
        );

        return () => {};
    }

    // Choose random channel name to avoid conflicts across origin.
    // Choose the current package version and instance id to avoid conflicts within Bear Auth.
    const channelName = `${name}@${version}_${id}_z7fQlNm+ujmESjbuHrnfrtx2WVvSLPlrQfyJaK7pmxQuxRa6q2xCHHP7`;
    const channel = new BroadcastChannel(channelName);
    const clientId = crypto.randomUUID();

    async function messageHandler(event: MessageEvent) {
        if (event.source === globalThis.window || location.origin !== event.origin || !event.isTrusted || !event.data) {
            return;
        }

        const { type, session } = event.data;

        if (type !== 'AUTH_SESSION_CHANGE' || event.data.clientId === clientId) {
            return;
        }
        const { logger } = getInstance(id);

        try {
            const instanceSession = getInstance(id).state.session;

            const sourceSessionHash = await getFingerprint(instanceSession);
            const targetSessionHash = await getFingerprint(session);

            if (sourceSessionHash === targetSessionHash) {
                return;
            }

            logger.debug(
                `[createAuthSessionBroadcastChannel]`,
                `Received auth session change message from another tab: ${session.status}`,
                {
                    session: { value: instanceSession, hash: sourceSessionHash },
                    incomingSession: { value: session, hash: targetSessionHash },
                },
            );

            switch (session.status as Session<unknown>['status']) {
                case 'authenticated':
                    if (
                        instanceSession.data?.expiration &&
                        session.data.expiration &&
                        instanceSession.data?.expiration > session.data.expiration
                    ) {
                        logger.debug(
                            `[createAuthSessionBroadcastChannel]`,
                            `Ignoring authenticated session from another tab (current session is newer).`,
                        );
                        return;
                    }

                    logger.debug(
                        `[createAuthSessionBroadcastChannel]`,
                        `Authenticated session received from another tab`,
                    );

                    await authenticate(id, session.data);
                    break;

                case 'unauthenticated':
                    logger.debug(
                        `[createAuthSessionBroadcastChannel]`,
                        `Unauthenticated session received from another tab`,
                    );

                    if (!getInstance(id).hooks.logout) {
                        setLogoutHook(id, async () => {});
                    }

                    getInstance(id).hooks.logout!();

                    break;
            }
        } catch (error) {
            if (isBearAuthError(error)) {
                logger.error(error);
            } else {
                logger.error(new BearAuthError('bear-auth/auth-session-broadcast', (error as Error).message, error));
            }
        }
    }

    channel.addEventListener('message', messageHandler);

    const offAuthStateChanged = onAuthStateChanged(id, session => {
        switch (session.status) {
            case 'authenticated':
            case 'unauthenticated':
                channel.postMessage({
                    type: 'AUTH_SESSION_CHANGE',
                    session,
                    clientId,
                } satisfies AuthSessionChange);
                break;
        }
    });

    return function cleanup() {
        channel.removeEventListener('message', messageHandler);
        offAuthStateChanged();
    };
}
