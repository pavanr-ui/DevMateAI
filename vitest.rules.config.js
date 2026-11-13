// Separate Vitest config for Firestore security-rules tests.
// They need the Firestore emulator, so they run via `npm run test:rules`.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.js'],
    testTimeout: 15000,
    fileParallelism: false,
  },
})
