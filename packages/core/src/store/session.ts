import type { BearAuth } from '../create.ts';
import { BearAuthError } from '../errors.ts';
import { getExpirationTimestampWithBuffer } from '../expiration.ts';
import { getInstance } from '../instances.ts';

export type RetrievingSession = {
    status: 'retrieving';
    data: null;
};

export type RefreshingSession<AuthInfo> = {
    status: 'refreshing';
    data: {
        accessToken: string;
        expiration: string;
        refreshToken: string;
        authInfo?: AuthInfo | null;
    };
};

export type SigningOutSession<AuthInfo> = {
    status: 'signing-out';
    data: {
        accessToken: string;
        expiration: string | null;
        refreshToken: string | null;
        authInfo?: AuthInfo | null;
    };
};

export type UnauthenticatedSession = {
    status: 'unauthenticated';
    data: null;
};

export type AuthenticatedSession<AuthInfo> = {
    status: 'authenticated';
    data: {
        accessToken: string;
        /**
         * Expiration timestamp in ISO format.
         */
        expiration: string | null;
        refreshToken: string | null;

        /**
         * Auth data (e.g. user info)
         */
        authInfo?: AuthInfo | null;
    };
};

export function createSession(): RetrievingSession {
    return {
        status: 'retrieving',
        data: null,
    };
}

export function setRefreshingSession<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const state = getInstance<AuthInfo>(id).state;

    state.session.status = 'refreshing';
}

export function setSigningOutSession<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const state = getInstance<AuthInfo>(id).state;

    state.session.status = 'signing-out';
}

export function setUnauthenticatedSession<AuthInfo>(id: BearAuth<AuthInfo>['id']) {
    const state = getInstance<AuthInfo>(id).state;

    state.session = {
        status: 'unauthenticated',
        data: null,
    } satisfies UnauthenticatedSession;
}

export function setAuthenticatedSession<AuthInfo>(
    id: BearAuth<AuthInfo>['id'],
    { accessToken, expiration, refreshToken, authInfo }: AuthenticatedSession<AuthInfo>['data'],
) {
    const state = getInstance<AuthInfo>(id).state;

    state.session = {
        status: 'authenticated',
        data: {
            accessToken,
            expiration,
            refreshToken,
            authInfo,
        },
    };
}

export function updateSessionAfterRefreshToken<AuthInfo>(
    id: BearAuth<AuthInfo>['id'],
    { accessToken, refreshToken, expiration, authInfo: freshAuthInfo }: RefreshingSession<AuthInfo>['data'],
) {
    const state = getInstance<AuthInfo>(id).state;

    setAuthenticatedSession(id, {
        accessToken,
        refreshToken,
        expiration: getExpirationTimestampWithBuffer(expiration),
        authInfo: freshAuthInfo ?? state.session.data!.authInfo,
    });
}

export function updateAuthInfo<AuthInfo>(id: BearAuth<AuthInfo>['id'], authInfo: AuthInfo) {
    const { state, logger } = getInstance<AuthInfo>(id);

    if (state.session.data) {
        state.session.data.authInfo = authInfo;
    } else {
        const error = new BearAuthError('bear-auth/update-auth-session-failed', 'Session is not authenticated.');
        logger.error(error, state.session);
        throw error;
    }
}

export type Session<AuthInfo> =
    | RetrievingSession
    | RefreshingSession<AuthInfo>
    | SigningOutSession<AuthInfo>
    | AuthenticatedSession<AuthInfo>
    | UnauthenticatedSession;

export type SessionData<AuthInfo> = Session<AuthInfo>['data'];
