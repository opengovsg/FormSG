/* eslint-env node */
module.exports = {
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
    'storybook-preset-craco',
    'storybook-react-i18next',
    {
      name: 'storybook-addon-turbo-build',
      options: {
        optimizationLevel: 2,
      },
    },
    '@storybook/addon-interactions',
  ],
  // webpackFinal setup retrieved from ChakraUI's own Storybook setup
  // https://github.com/chakra-ui/chakra-ui/blob/main/.storybook/main.js
  webpackFinal: async (storybookConfig) => {
    // Required to sync aliases between storybook and overriden configs
    return {
      ...storybookConfig,
      module: {
        rules: [
          ...storybookConfig.module.rules,
          {
            type: 'javascript/auto',
            test: /\.mjs$/,
            include: /node_modules/,
          },
          {
            // Added to fix ticket:
            // https://linear.app/ogp/issue/FRM-1857/fix-chromatic-build-failure-due-es2018-features-not-supported
            test: /\.(?:jsx?|tsx?|vue)$/,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  presets: [
                    '@babel/preset-env',
                    [
                      '@babel/preset-react',
                      {
                        runtime: 'automatic',
                      },
                    ],
                    '@babel/preset-typescript',
                  ],
                  plugins: [
                    '@babel/plugin-transform-async-to-generator',
                    '@babel/plugin-proposal-async-generator-functions',
                  ],
                },
              },
            ],
          },
        ],
      },
    }
  },
  // For injecitng environment variables into Storybook runs
  // (see: https://github.com/storybookjs/storybook/issues/12270#issuecomment-1139104523)
  env: (config) => ({
    ...config,
    NODE_ENV: 'test',
  }),
}
