/* eslint-env node */
module.exports = {
  features: {
    storyStoreV7: true,
  },
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
    'storybook-preset-craco',
    // Note that @storybook/addon-interactions must be listed after @storybook/addon-actions or @storybook/addon-essentials.
    '@storybook/addon-interactions',
    {
      name: 'storybook-addon-turbo-build',
      options: {
        optimizationLevel: 2,
      },
    },
  ],
  // webpackFinal setup retrieved from ChakraUI's own Storybook setup
  // https://github.com/chakra-ui/chakra-ui/blob/main/.storybook/main.js
  webpackFinal: async (storybookConfig) => {
    // Required to sync aliases between storybook and overriden configs
    return {
      ...storybookConfig,
      resolve: {
        ...storybookConfig.resolve,
        alias: {
          ...storybookConfig.resolve.alias,
          // Required so storybook knows where the npm package is to render ChakraUI components
          // as this is not directly installed in package.json.
          '@emotion/core': '@emotion/react',
          'emotion-theming': '@emotion/react',
        },
      },
    }
  },
}
