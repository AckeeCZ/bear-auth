import './styles/App.css';

import { useState } from 'react';
import {
    authenticate,
    getAccessToken,
    getExpirationTimestamp,
    onAuthStateChanged,
    retrieveAuthSession,
    Session,
} from '@bear-auth/core';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AuthInfo, bearAuthId, logout } from './bear-auth';
import { generateMockToken } from './utils';

function App() {
    const [session, setSession] = useState<Session<AuthInfo>>({
        data: null,
        status: 'retrieving',
    });

    const retrieveAuthSessionResult = useQuery({
        queryKey: ['retrieveAuthSession'],
        queryFn: async () => {
            onAuthStateChanged<AuthInfo>(bearAuthId, async session => {
                console.log('onAuthStateChanged', session.status);
                setSession(session);
            });

            await retrieveAuthSession<AuthInfo>(bearAuthId);

            return null;
        },
        enabled: true,
        retry: false,
        refetchOnWindowFocus: false,
        refetchInterval: false,
    });

    const signIn = useMutation({
        mutationFn: async () => {
            await authenticate<AuthInfo>(bearAuthId, {
                accessToken: generateMockToken('accessToken'),
                expiration: getExpirationTimestamp(250_000), // 250s
                refreshToken: generateMockToken('refreshToken'),
                authInfo: {
                    user: {
                        id: 'some-user-id',
                        email: 'some-user@email.com',
                    },
                },
            });
        },
    });

    const getAccessTokenResult = useMutation({
        mutationFn: async () => getAccessToken(bearAuthId),
    });

    if (retrieveAuthSessionResult.error) {
        console.error(retrieveAuthSessionResult.error);
    }

    return (
        <>
            <h1>Bear Auth - Core Example</h1>

            <div
                style={{
                    display: 'grid',
                    gap: '8px',
                }}
            >
                <p data-testid='auth-status'>Status: {session.status}</p>

                <button
                    type='button'
                    onClick={() => signIn.mutateAsync()}
                    disabled={retrieveAuthSessionResult.isLoading}
                    data-testid='authenticate-button'
                >
                    Authenticate
                </button>

                <button
                    type='button'
                    onClick={() => logout()}
                    disabled={retrieveAuthSessionResult.isLoading}
                    data-testid='logout-button'
                >
                    Logout
                </button>

                <button
                    type='button'
                    data-testid='retrieve-auth-session-button'
                    onClick={async () => {
                        const accessToken = await getAccessTokenResult.mutateAsync();

                        console.log({ accessToken });
                    }}
                >
                    Get access token
                </button>
            </div>
        </>
    );
}

export default App;
