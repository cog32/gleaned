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
      '.covid/**'
    ]
  }
})
