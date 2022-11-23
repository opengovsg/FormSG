/* eslint-env node */
const { CracoAliasPlugin } = require('react-app-alias-ex')
const merge = require('lodash/merge')
const path = require('path')

const customJestConfig = require('./jest.config')

module.exports = {
  jest: {
    configure: (jestConfig) => {
      const newConfig = merge({}, jestConfig, customJestConfig)
      return newConfig
    },
  },
  plugins: [
    {
      plugin: CracoAliasPlugin,
      options: {},
    },
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          const oneOfRule = webpackConfig.module.rules.find(
            (rule) => rule.oneOf,
          )

          if (oneOfRule) {
            const tsxRule = oneOfRule.oneOf.find(
              (rule) => rule.test && rule.test.toString().includes('tsx'),
            )

            const newIncludePaths = [path.resolve(__dirname, '../shared')]
            if (tsxRule) {
              if (Array.isArray(tsxRule.include)) {
                tsxRule.include = [...tsxRule.include, ...newIncludePaths]
              } else {
                tsxRule.include = [tsxRule.include, ...newIncludePaths]
              }
            }
          }
          // polyfill node built-in for csv-string dependency
          webpackConfig.resolve.fallback = {
            stream: require.resolve('stream-browserify'),
          }
          return webpackConfig
        },
      },
    },
  ],
}
