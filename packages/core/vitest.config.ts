import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['./src/**/*.test.{tsx,ts}'],
        projects: [
            {
                extends: '../../vitest.config.ts',
            },
        ],
    },
    resolve: {
        alias: {
            '~': resolve(import.meta.dirname, './src'),
        },
    },
});
