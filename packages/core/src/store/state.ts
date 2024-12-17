import { createSession, type Session } from './session';

export type State<AuthInfo> = {
    session: Session<AuthInfo>;
};

export function createInitialState<AuthInfo>(): State<AuthInfo> {
    const initialState = {
        session: createSession(),
    } as const satisfies State<AuthInfo>;

    return initialState;
}
