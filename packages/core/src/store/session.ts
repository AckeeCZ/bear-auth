import type { BearAuth } from '~/create';
import { getExpirationTimestampWithBuffer } from '~/expiration';
import { getInstance } from '~/instances';

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

export function setRefreshingSession<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    const state = getInstance<AuthInfo>(instanceId).state;

    state.session.status = 'refreshing';
}

export function setSigningOutSession<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    const state = getInstance<AuthInfo>(instanceId).state;

    state.session.status = 'signing-out';
}

export function setUnauthenticatedSession<AuthInfo>(instanceId: BearAuth<AuthInfo>['id']) {
    const state = getInstance<AuthInfo>(instanceId).state;

    state.session = {
        status: 'unauthenticated',
        data: null,
    } satisfies UnauthenticatedSession;
}

export function setAuthenticatedSession<AuthInfo>(
    instanceId: BearAuth<AuthInfo>['id'],
    { accessToken, expiration, refreshToken, authInfo }: AuthenticatedSession<AuthInfo>['data'],
) {
    const state = getInstance<AuthInfo>(instanceId).state;

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
    instanceId: BearAuth<AuthInfo>['id'],
    { accessToken, refreshToken, expiration, authInfo: freshAuthInfo }: RefreshingSession<AuthInfo>['data'],
) {
    const state = getInstance<AuthInfo>(instanceId).state;

    setAuthenticatedSession(instanceId, {
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
