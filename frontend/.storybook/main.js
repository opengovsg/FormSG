const path = require('path')
const toPath = (_path) => path.join(process.cwd(), _path)

module.exports = {
  // Welcome story set first so it will show up first.
  stories: [
    './Welcome/Welcome.stories.tsx',
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/preset-create-react-app',
  ],
  // webpackFinal setup retrieved from ChakraUI's own Storybook setup
  // https://github.com/chakra-ui/chakra-ui/blob/main/.storybook/main.js
  webpackFinal: async (storybookConfig) => {
    return {
      ...storybookConfig,
      resolve: {
        ...storybookConfig.resolve,
        // Required so storybook knows where the npm package is to render ChakraUI components
        // as this is not directly installed in package.json.
        alias: {
          ...storybookConfig.resolve.alias,
          '@emotion/core': toPath('node_modules/@emotion/react'),
          'emotion-theming': toPath('node_modules/@emotion/react'),
        },
      },
    }
  },
}
