import { setLoadingSession, type Session } from './session';

export type State<AuthInfo> = {
    session: Session<AuthInfo>;
};

export function createInitialState<AuthInfo>(): State<AuthInfo> {
    const initialState = {} as State<AuthInfo>;

    const nextState = setLoadingSession<AuthInfo>(initialState);

    return nextState;
}
