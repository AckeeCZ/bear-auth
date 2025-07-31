import { createSession, type Session } from './session.ts';

export type State<AuthInfo> = Readonly<{
    session: Session<AuthInfo>;
}>;

export function createStore<AuthInfo>() {
    let state: Readonly<State<AuthInfo>> = {
        session: createSession(),
    } as const;

    return {
        async setSession(producer: (currentSession: State<AuthInfo>['session']) => State<AuthInfo>['session']) {
            const nextSession = producer(Object.freeze(state.session));

            state = {
                ...state,
                session: nextSession,
            };
        },
        getSession(): State<AuthInfo>['session'] {
            return Object.freeze(state.session);
        },
    };
}
