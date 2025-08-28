import { getExpirationTimestampWithBuffer } from '../expiration.ts';
import type { State } from './store.ts';

export type RetrievingSession = Readonly<{
    status: 'retrieving';
    data: null;
}>;

export type RefreshingSession<AuthInfo> = Readonly<{
    status: 'refreshing';
    data: {
        accessToken: string;
        expiration: string;
        refreshToken: string;
        authInfo?: AuthInfo | null;
    };
}>;

export type SigningOutSession<AuthInfo> = Readonly<{
    status: 'signing-out';
    data: {
        accessToken: string;
        expiration: string | null;
        refreshToken: string | null;
        authInfo?: AuthInfo | null;
    };
}>;

export type UnauthenticatedSession = Readonly<{
    status: 'unauthenticated';
    data: null;
}>;

export type AuthenticatedSession<AuthInfo> = Readonly<{
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
}>;

export function createSession(): Readonly<RetrievingSession> {
    return {
        status: 'retrieving',
        data: null,
    };
}

export function setRefreshingSession<AuthInfo>(session: State<AuthInfo>['session']): RefreshingSession<AuthInfo> {
    return {
        status: 'refreshing',
        // @ts-expect-error
        data: session.data,
    } as const;
}

export function setSigningOutSession<AuthInfo>(session: State<AuthInfo>['session']): SigningOutSession<AuthInfo> {
    return {
        status: 'signing-out',
        // @ts-expect-error
        data: session.data,
    } as const;
}

export function setUnauthenticatedSession(): UnauthenticatedSession {
    return {
        status: 'unauthenticated',
        data: null,
    } as const;
}

export function setAuthenticatedSession<AuthInfo>({
    accessToken,
    expiration,
    refreshToken,
    authInfo,
}: AuthenticatedSession<AuthInfo>['data']): AuthenticatedSession<AuthInfo> {
    return {
        status: 'authenticated',
        data: {
            accessToken,
            expiration,
            refreshToken,
            authInfo,
        },
    } as const;
}

export function updateSessionAfterRefreshToken<AuthInfo>(
    session: State<AuthInfo>['session'],
    { accessToken, refreshToken, expiration, authInfo: freshAuthInfo }: RefreshingSession<AuthInfo>['data'],
): AuthenticatedSession<AuthInfo> {
    return setAuthenticatedSession({
        accessToken,
        refreshToken,
        expiration: getExpirationTimestampWithBuffer(expiration),
        authInfo: freshAuthInfo ?? session.data?.authInfo ?? null,
    });
}

export type Session<AuthInfo> =
    | RetrievingSession
    | RefreshingSession<AuthInfo>
    | SigningOutSession<AuthInfo>
    | AuthenticatedSession<AuthInfo>
    | UnauthenticatedSession;

export type SessionData<AuthInfo> = Readonly<Session<AuthInfo>['data']>;
