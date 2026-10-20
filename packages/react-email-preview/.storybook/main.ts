/* eslint-disable storybook/no-uninstalled-addons */
import { createRequire } from 'node:module'
import { dirname, join } from 'path'
import type { StorybookConfig } from '@storybook/react-vite'

const require = createRequire(import.meta.url)

// Resolves from this package so the framework loads under pnpm.
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')))
}

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  // For injecitng environment variables into Storybook runs
  // Envs must be prefixed with STORYBOOK_ on vite-builds
  env: (config) => ({
    ...config,
    STORYBOOK_NODE_ENV: 'test',
  }),
}

export default config
