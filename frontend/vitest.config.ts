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
        pool: 'forks', // Even though the default should be 'forks' but for some reason this has to be specified otherwise there would be issues with tests throwing cryptic errors
      },
    }),
  ),
)
