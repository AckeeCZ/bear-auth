import { useContext } from 'react';
import type { Session } from '@bear-auth/core';

import { AuthSessionContext } from '../context/index.ts';

export function useBearAuthSession<AuthInfo>() {
    const ctx = useContext(AuthSessionContext);

    if (ctx === null) {
        throw new Error('useBearAuthSession must be used within a BearAuthProvider');
    }

    return ctx as Session<AuthInfo>;
}
