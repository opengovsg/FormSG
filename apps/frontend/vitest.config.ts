import { argosVitestPlugin } from '@argos-ci/storybook/vitest-plugin'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import * as fsPromises from 'node:fs/promises'
import * as streamPromises from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

// An empty module that still has every named export of its Node counterpart,
// so esbuild accepts `import { readFile } from 'node:fs/promises'`.
const stubExports = (specifier: string) => {
  const names = Object.keys(
    specifier.endsWith('fs/promises') ? fsPromises : streamPromises,
  )
  return `export default {}; ${names
    .filter((name) => name !== 'default')
    .map((name) => `export const ${name} = undefined`)
    .join(';')}`
}

export default defineConfig((configEnv) => {
  const appConfig = viteConfig(configEnv)
  return mergeConfig(
    appConfig,
    defineConfig({
      test: {
        // Global option: it has no effect inside a project.
        dangerouslyIgnoreUnhandledErrors: true, // there's some flakey unhandlederror surfaced by vitest, but there isn't enough information to discern if it is a real issue. Actual test failures, will still fail the tests.
        projects: [
          {
            extends: true,
            test: {
              name: 'unit',
              setupFiles: ['./vitest-setup.ts'],
              globals: true,
              environment: 'jsdom', // For storybook tests to work properly
            },
          },
          {
            // Runs every story in a real browser and screenshots it for Argos.
            // Reuses the app's aliases and plugins. The Node polyfills are kept
            // for app code (csv-string needs `stream`), but they shim
            // `node:fs/promises` into a path that doesn't exist, which breaks
            // pre-bundling of Storybook's own Node code, so those two get stubs.
            ...appConfig,
            optimizeDeps: {
              // Found lazily by stories; listing them avoids a mid-run
              // re-optimize that reloads the page and fails a cold CI run.
              include: [
                '@datadog/browser-rum',
                '@loadable/component',
                'p-queue',
                'polyfill-object.fromentries',
                'react-dev-inspector',
                'react-google-charts',
                'react-query/devtools',
                'react-wordcloud',
                'stopword',
                'url',
              ],
              esbuildOptions: {
                plugins: [
                  {
                    name: 'stub-node-promises',
                    setup(build) {
                      build.onResolve(
                        { filter: /^(node:)?(fs|stream)\/promises$/ },
                        ({ path }) => ({ path, namespace: 'stub-node' }),
                      )
                      build.onLoad(
                        { filter: /.*/, namespace: 'stub-node' },
                        ({ path }) => ({
                          contents: stubExports(path),
                          loader: 'js',
                        }),
                      )
                    },
                  },
                ],
              },
            },
            plugins: [
              ...(appConfig.plugins ?? []),
              storybookTest({
                configDir: fileURLToPath(
                  new URL('.storybook', import.meta.url),
                ),
                // Playgrounds are for poking at args, not for regression.
                tags: { skip: ['playground'] },
              }),
              argosVitestPlugin({
                // CI uploads from the workflow so subset builds can be skipped.
                uploadToArgos: false,
                // Viewport-sized stories (see `beforeEach` in the preview).
                argosCSS: 'body[data-argos-viewport] { min-width: 100vw; }',
              }),
            ],
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
          },
        ],
      },
    }),
  )
})
