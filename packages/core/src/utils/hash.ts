/**
 * Get SHA-256 hash of the provided data.
 */
export async function getFingerprint<Data>(data: Data): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(JSON.stringify(data));

    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);

    const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return hash;
}
