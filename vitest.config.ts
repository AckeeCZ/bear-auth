import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        projects: ['packages/*'],
        coverage: {
            include: ['packages/*/src/**/*.{ts,tsx}'],
        },
    },
});
