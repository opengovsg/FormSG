const path = require('path')

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
  webpackFinal: async (storybookWebpackConfig) => {
    // include shared folder under babel-loader
    const oneOfRule = storybookWebpackConfig.module.rules.find(
      (rule) => rule.oneOf,
    )
    if (oneOfRule) {
      const tsxRule = oneOfRule.oneOf.find(
        (rule) => rule.test && rule.test.toString().includes('tsx'),
      )

      const newIncludePaths = [path.resolve(__dirname, '../../shared')]
      if (tsxRule) {
        if (Array.isArray(tsxRule.include)) {
          tsxRule.include = [...tsxRule.include, ...newIncludePaths]
        } else {
          tsxRule.include = [tsxRule.include, ...newIncludePaths]
        }
      }
    }

    // taken from tsconfig.paths.json
    storybookWebpackConfig.resolve.alias = {
      ...storybookWebpackConfig.resolve.alias,
      '~shared': path.resolve('../shared'),
      '~assets': path.resolve('./src/assets'),
      '~contexts': path.resolve('./src/contexts'),
      '~constants': path.resolve('./src/constants'),
      '~components': path.resolve('./src/components'),
      '~templates': path.resolve('./src/templates'),
      '~features': path.resolve('./src/features'),
      '~hooks': path.resolve('./src/hooks'),
      '~utils': path.resolve('./src/utils'),
      '~pages': path.resolve('./src/pages'),
      '~services': path.resolve('./src/services'),
      '~theme': path.resolve('./src/theme'),
      '~typings': path.resolve('./src/typings'),
      '~': path.resolve('./src'),
    }

    // polyfill node built-in for csv-string dependency
    storybookWebpackConfig.resolve.fallback = {
      stream: require.resolve('stream-browserify'),
    }
    return storybookWebpackConfig
  },
  core: {
    builder: 'webpack5',
  },
}
