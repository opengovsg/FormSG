/* eslint-env node */
const tsconfigPaths = require('vite-tsconfig-paths')
const nodePolyfills = require('vite-plugin-node-stdlib-browser')
const { mergeConfig } = require('vite')

const config = {
  staticDirs: ['../public'],
  stories: [
    // Introduction stories set first so stories are ordered correctly.
    './introduction/Welcome/Welcome.stories.tsx',
    './introduction/Principles/Principles.stories.tsx',
    './foundations/**/*.stories.@(mdx|js|jsx|ts|tsx)',
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    'storybook-react-i18next',
    '@storybook/addon-interactions',
  ],
  core: {
    builder: '@storybook/builder-vite', // 👈 The builder enabled here.
  },
  async viteFinal(config) {
    // Merge custom configuration into the default config
    return mergeConfig(config, {
      plugins: [tsconfigPaths.default(), nodePolyfills()],
      // manually specify plugins to avoid conflict
    })
  },
}

module.exports = config
