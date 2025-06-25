import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
    onAuthStateChanged,
    retrieveAuthSession,
    type Session,
    type setFetchAuthInfoHook,
    type setLogoutHook,
    type setRefreshTokenHook,
} from '@bear-auth/core';

import { AuthSessionContext, BearAuthProviderContext } from './context/index.ts';

export interface BearAuthProviderProps<AuthInfo> {
    /**
     * Bear auth instance ID (return value of the `create` method)
     */
    id: string;

    actions: {
        logout: ReturnType<typeof setLogoutHook<AuthInfo>>;

        /**
         * Required if the `authenticated` method returns `authInfo`
         */
        refetchAuthInfo?: ReturnType<typeof setFetchAuthInfoHook<AuthInfo>>;

        /**
         * Required if the `authenticated` method returns `refreshToken`
         */
        refreshToken?: ReturnType<typeof setRefreshTokenHook<AuthInfo>>;
    };

    loader?: ReactNode;

    children: ReactNode;
}

export type Actions<AuthInfo> = BearAuthProviderProps<AuthInfo>['actions'];

export const BearAuthProvider = <AuthInfo,>({
    children,
    id,
    actions,
    loader = null,
}: BearAuthProviderProps<AuthInfo>) => {
    const [session, setSession] = useState<Session<AuthInfo> | null>(null);
    const actionsRef = useRef<Actions<AuthInfo>>(actions);
    const retrievingSession = useRef(false);

    useEffect(() => {
        if (retrievingSession.current) {
            return;
        }

        retrievingSession.current = true;

        // NOTE: Intentional, I do avoid return the unsubscribe function in useEffect.
        onAuthStateChanged<AuthInfo>(id, setSession);

        retrieveAuthSession<AuthInfo>(id).finally(() => {
            retrievingSession.current = false;
        });
    }, [id, retrievingSession]);

    if (session === null) {
        return <>{loader}</>;
    }

    return (
        <BearAuthProviderContext.Provider
            value={{
                id,
                actions: actionsRef.current,
            }}
        >
            <AuthSessionContext.Provider value={session}>{children}</AuthSessionContext.Provider>
        </BearAuthProviderContext.Provider>
    );
};
