export function generateMockToken(prefix: string) {
    return `${prefix}_${Math.random().toString(36).substring(2)}`;
}
