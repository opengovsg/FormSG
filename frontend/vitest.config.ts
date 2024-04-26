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
      },
    }),
  ),
)
