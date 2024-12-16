export function generateMockToken<Prefix extends string>(prefix: Prefix) {
    return `${prefix}_${Math.random().toString(36).substring(2)}` as const;
}
