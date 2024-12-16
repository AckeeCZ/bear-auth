import { castDraft, produce } from 'immer';

import { getExpirationTimestampWithBuffer } from '~/expiration';
import type { RefreshTookHandlerResult } from '~/hooks/setRefreshTokenHook';
import type { AuthSession } from '~/types';

import type { State } from './state';

export type UnauthenticatedSession = {
    status: 'unauthenticated';
    data: null;
};

export function setUnauthenticatedSession<AuthInfo>(state: State<AuthInfo>) {
    return produce(state, draft => {
        draft.session = {
            status: 'unauthenticated',
            data: null,
        } satisfies UnauthenticatedSession;
    });
}

export type LoadingSession = {
    status: 'loading';
    data: null;
};

export function setLoadingSession<AuthInfo>(state: State<AuthInfo>) {
    return produce(state, draft => {
        draft.session = {
            status: 'loading',
            data: null,
        } satisfies LoadingSession;
    });
}

export type Authenticatedession<AuthInfo> = {
    status: 'authenticated';
    data: AuthSession<AuthInfo>;
};

export function setAuthenticatedSession<AuthInfo>(
    state: State<AuthInfo>,
    { accessToken, expiration, refreshToken, authInfo }: Authenticatedession<AuthInfo>['data'],
) {
    return produce(state, draft => {
        draft.session = {
            status: 'authenticated',
            data: {
                accessToken,
                expiration,
                refreshToken,
                authInfo: castDraft(authInfo),
            },
        };
    });
}

export function updateSessionAfterRefreshToken<AuthInfo>(
    state: State<AuthInfo>,
    { accessToken, refreshToken, expiration, authInfo: freshAuthInfo }: RefreshTookHandlerResult<AuthInfo>,
) {
    return produce(state, draft => {
        Object.assign(draft.session.data!, {
            accessToken,
            refreshToken,
            expiration: getExpirationTimestampWithBuffer(expiration),
            authInfo: freshAuthInfo ?? state.session.data!.authInfo,
        });
    });
}

export function updateAuthInfo<AuthInfo>(state: State<AuthInfo>, authInfo: AuthInfo) {
    return produce(state, draft => {
        draft.session.data!.authInfo = castDraft(authInfo);
    });
}

export type Session<AuthInfo> = LoadingSession | Authenticatedession<AuthInfo> | UnauthenticatedSession;
