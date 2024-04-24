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
    {
      name: 'storybook-addon-turbo-build',
      options: {
        optimizationLevel: 2,
      },
    },
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
}

export default config
