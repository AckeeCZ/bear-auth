import { authenticate, getAccessToken } from '@bear-auth/core';
import { useBearAuth, useBearAuthSession } from '@bear-auth/react';

import { AuthInfo } from '../App';

export const AuthBearSection = () => {
    const session = useBearAuthSession<AuthInfo>();
    const { id, actions } = useBearAuth<AuthInfo>();

    console.log({ session, id, actions });

    return (
        <div
            style={{
                display: 'grid',
                gap: '8px',
            }}
        >
            <button
                type='button'
                onClick={() =>
                    authenticate<AuthInfo>(id, {
                        accessToken: '...access-token...',
                        expiresIn: 20,
                        refreshToken: '...refresh-token...',
                        authInfo: {
                            user: {
                                id: 'some-user-id',
                                username: 'some-user@email.com',
                            },
                        },
                    })
                }
                disabled={session.status === 'loading'}
            >
                Authenticate
            </button>

            <button type='button' onClick={() => actions.logout()} disabled={session.status === 'loading'}>
                Logout
            </button>

            <button
                type='button'
                onClick={async () => {
                    const accessToken = await getAccessToken(id);

                    console.log({ accessToken });
                }}
            >
                Get access token
            </button>
        </div>
    );
};
