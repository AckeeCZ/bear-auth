import { createContext } from 'react';
import type { Session } from '@bear-auth/core';

import type { Actions } from '../BearAuthProvider';

export type BearAuthContextType<AuthInfo> = {
    id: string;
    actions: Actions<AuthInfo>;
};

export const BearAuthProviderContext = createContext<BearAuthContextType<unknown> | null>(null);

export const AuthSessionContext = createContext<Session<unknown> | null>(null);
