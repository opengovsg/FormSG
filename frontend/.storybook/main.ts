/* eslint-disable storybook/no-uninstalled-addons */
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  staticDirs: ['../public'],
  stories: [
    './introduction/Welcome/Welcome.stories.tsx',
    './introduction/Principles/Principles.stories.tsx',
    './foundations/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // For injecitng environment variables into Storybook runs
  // (see: https://github.com/storybookjs/storybook/issues/12270#issuecomment-1139104523)
  env: (config) => ({
    ...config,
    NODE_ENV: 'test',
  }),
}

export default config
