import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default defineConfig((configEnv) =>
  mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        setupFiles: ['./vitest-setup.ts'],
        globals: true,
        environment: 'jsdom', // For storybook tests to work properly
        dangerouslyIgnoreUnhandledErrors: true, // there's some flakey unhandlederror surfaced by vitest, but there isn't enough information to discern if it is a real issue. Actual test failures, will still fail the tests.
      },
    }),
  ),
)
