export type AuthSession<AuthInfo> = {
    /**
     * Access token
     */
    accessToken: string;

    /**
     * Expiration timestamp in ISO format.
     */
    expiration: string | null;

    /**
     * Refresh token
     */
    refreshToken: string | null;

    /**
     * Auth data (e.g. user info)
     */
    authInfo: AuthInfo | null;
};
