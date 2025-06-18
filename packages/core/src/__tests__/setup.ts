import { vi } from 'vitest';

vi.mock('~/network.ts', async importOriginal => {
    const original = await importOriginal<typeof import('~/network.ts')>();
    return {
        ...original,
        defaultContinueWhenOnline: vi.fn().mockResolvedValue(undefined),
        setContinueWhenOnline: vi.fn(),
    };
});
