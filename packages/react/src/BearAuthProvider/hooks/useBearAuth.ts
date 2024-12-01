import { useContext } from 'react';

import { BearAuthProviderContext, type BearAuthContextType } from '../context';

export function useBearAuth<AuthInfo>() {
    const ctx = useContext(BearAuthProviderContext);

    if (ctx === null) {
        throw new Error('useBearAuth() must be used within a BearAuthProvider');
    }

    return ctx as BearAuthContextType<AuthInfo>;
}
