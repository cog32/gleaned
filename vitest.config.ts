import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/helpers/test-setup.ts'],
    // Avoid picking up tests from nested submodules like .covid/
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '.covid/**',
      'e2e/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      reportOnFailure: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  }
})
