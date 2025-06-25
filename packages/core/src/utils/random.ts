export function getRandomId(length: number) {
    return crypto.getRandomValues(new Uint8Array(length)).reduce((acc, byte) => acc + byte.toString(36), '');
}
