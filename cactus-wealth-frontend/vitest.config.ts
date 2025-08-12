import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: true,
    deps: {
      moduleDirectories: ['node_modules', '.'],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
    include: [
      'tests/integration/**/*.{test,spec}.{ts,tsx}',
      'tests/services/**/*.{test,spec}.{ts,tsx}',
      'services/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'tests/components/**/*.{test,spec}.{ts,tsx}',
      'hooks/**/__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'e2e',
      'playwright-report',
      'test-results',
      '.next',
      'node_modules',
    ],
  },
  resolve: {
    alias: {
      '@jest/globals': 'vitest',
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})


