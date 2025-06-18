import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['./src/**/*.{test,spec}.{ts,tsx}'],
        setupFiles: ['./src/__tests__/setup.ts'],
    },
    resolve: {
        alias: {
            '~': resolve(import.meta.dirname, './src'),
        },
    },
});
