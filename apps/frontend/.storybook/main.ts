// This file has been automatically migrated to valid ESM format by Storybook.
/* eslint-disable storybook/no-uninstalled-addons */
import type { StorybookConfig } from '@storybook/react-vite'
import { createRequire } from 'node:module'
import { dirname, join } from 'path'

const require = createRequire(import.meta.url)

// Resolves from this package so the framework and addons load under pnpm.
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')))
}

const config: StorybookConfig = {
  staticDirs: ['../public'],
  stories: [
    './introduction/Welcome/Welcome.stories.tsx',
    './introduction/Principles/Principles.stories.tsx',
    './foundations/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-themes'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  // For injecitng environment variables into Storybook runs
  // Envs must be prefixed with STORYBOOK_ on vite-builds
  env: (config: Record<string, string>) => ({
    ...config,
    STORYBOOK_NODE_ENV: 'test',
  }),
}

export default config
