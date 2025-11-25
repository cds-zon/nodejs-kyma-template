import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './globalSetup.ts',
    setupFiles: ['./simple-testSetup.ts'],
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});

