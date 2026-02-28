import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        setupFiles: ['./test/env-setup.ts', './test/setup.ts'],
        globalSetup: ['./test/global-setup.ts'],
    },
});
