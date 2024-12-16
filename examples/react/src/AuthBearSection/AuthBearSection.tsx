import { authenticate, getAccessToken, getExpirationTimestamp } from '@bear-auth/core';
import { useBearAuth, useBearAuthSession } from '@bear-auth/react';

import { AuthInfo } from '../App';
import { generateMockToken } from '../utils';

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
                        accessToken: generateMockToken('accessToken'),
                        expiration: getExpirationTimestamp(250_000),
                        refreshToken: generateMockToken('refreshToken'),
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
