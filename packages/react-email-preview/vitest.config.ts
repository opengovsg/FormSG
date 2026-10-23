import { fileURLToPath } from 'node:url'

import { argosVitestPlugin } from '@argos-ci/storybook/vitest-plugin'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// Runs every story in a real browser and screenshots it for Argos.
export default defineConfig({
  plugins: [
    storybookTest({
      configDir: fileURLToPath(new URL('.storybook', import.meta.url)),
    }),
    argosVitestPlugin({
      // CI uploads from the workflow.
      uploadToArgos: false,
    }),
  ],
  esbuild: { jsx: 'automatic' }, // .storybook is outside tsconfig's include
  // Used by the preview decorator. Listed so a cold run doesn't find it
  // mid-way and reload the page.
  optimizeDeps: { include: ['react-dom/server', 'react/jsx-dev-runtime'] },
  test: {
    name: 'storybook',
    // Each worker is a Chromium page; unbounded, this exhausts memory.
    maxWorkers: 2,
    browser: {
      enabled: true,
      provider: playwright({
        // Stable text rendering across machines.
        launchOptions: {
          args: ['--disable-lcd-text', '--font-render-hinting=none'],
        },
      }),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
})
