export function generateMockToken(prefix: string) {
    return `${prefix}_${Math.random().toString(36).substring(2)}`;
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
