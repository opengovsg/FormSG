/* eslint-disable storybook/no-uninstalled-addons */
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: [ 
    '../emails/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [ 
  ],
  framework: {
    name: '@storybook/react-vite',
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

