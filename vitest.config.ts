import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        'packages/types/**/*.ts',
        '**/*.test.ts',
        '**/*.d.ts',
        '**/node_modules/**',
      ],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80,
      },
      reporter: ['text', 'lcov'],
    },
  },
});
