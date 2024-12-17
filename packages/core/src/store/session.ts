import { getExpirationTimestampWithBuffer } from '~/expiration';

import type { State } from './state';

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

export function setRefreshingSession<AuthInfo>(state: State<AuthInfo>) {
    state.session.status = 'refreshing';
}

export function setSigningOutSession<AuthInfo>(state: State<AuthInfo>) {
    state.session.status = 'signing-out';
}

export function setUnauthenticatedSession<AuthInfo>(state: State<AuthInfo>) {
    state.session = {
        status: 'unauthenticated',
        data: null,
    } satisfies UnauthenticatedSession;
}

export function setAuthenticatedSession<AuthInfo>(
    state: State<AuthInfo>,
    { accessToken, expiration, refreshToken, authInfo }: AuthenticatedSession<AuthInfo>['data'],
) {
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
    state: State<AuthInfo>,
    { accessToken, refreshToken, expiration, authInfo: freshAuthInfo }: RefreshingSession<AuthInfo>['data'],
) {
    setAuthenticatedSession(state, {
        accessToken,
        refreshToken,
        expiration: getExpirationTimestampWithBuffer(expiration),
        authInfo: freshAuthInfo ?? state.session.data!.authInfo,
    });
}

export function updateAuthInfo<AuthInfo>(state: State<AuthInfo>, authInfo: AuthInfo) {
    state.session.data!.authInfo = authInfo;
}

export type Session<AuthInfo> =
    | RetrievingSession
    | RefreshingSession<AuthInfo>
    | SigningOutSession<AuthInfo>
    | AuthenticatedSession<AuthInfo>
    | UnauthenticatedSession;

export type SessionData<AuthInfo> = Session<AuthInfo>['data'];
