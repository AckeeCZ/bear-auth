export type Retry = ((error: unknown, failureCount: number) => boolean | Promise<boolean>) | boolean;

export async function resolveRetry(retry: Retry | undefined, error: unknown, failureCount: number): Promise<boolean> {
    if (!retry) {
        return false;
    }

    if (typeof retry === 'function') {
        return retry(error, failureCount);
    }

    return true;
}

export const MAX_RETRY_COUNT = 5;
