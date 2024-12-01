import './App.css';

import { authenticate, getAccessToken, retrieveAuthSession } from '@bear-auth/core';
import { useMutation, useQuery } from '@tanstack/react-query';

import { bearAuthId, logout } from './bear-auth';

function App() {
    const retrieveAuthSessionResult = useQuery({
        queryKey: ['retrieveAuthSession'],
        queryFn: async () => {
            await retrieveAuthSession(bearAuthId);

            return null;
        },
        enabled: true,
        retry: false,
        refetchOnWindowFocus: false,
        refetchInterval: false,
    });

    const signIn = useMutation({
        mutationFn: async () => {
            await authenticate(bearAuthId, {
                accessToken: '...access-token...',
                expiresIn: 20,
                refreshToken: '...refresh-token...',
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
            <h1>Bear Auth</h1>

            {retrieveAuthSessionResult.isLoading && <p>Loading...</p>}
            {retrieveAuthSessionResult.error && <p>Status: {retrieveAuthSessionResult.error?.message}</p>}

            <div
                style={{
                    display: 'grid',
                    gap: '8px',
                }}
            >
                <button
                    type='button'
                    onClick={() => signIn.mutateAsync()}
                    disabled={retrieveAuthSessionResult.isLoading}
                >
                    Authenticate
                </button>

                <button type='button' onClick={() => logout()} disabled={retrieveAuthSessionResult.isLoading}>
                    Logout
                </button>

                <button
                    type='button'
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
