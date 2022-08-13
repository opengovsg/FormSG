/* eslint-env node */
const CracoAlias = require('craco-alias')
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
      plugin: CracoAlias,
      options: {
        source: 'tsconfig',
        // baseUrl SHOULD be specified
        // plugin does not take it from tsconfig
        baseUrl: '.',
        // tsConfigPath should point to the file where "baseUrl" and "paths" are specified
        tsConfigPath: './tsconfig.paths.json',
        unsafeAllowModulesOutsideOfSrc: true,
      },
    },
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          // include shared folder under babel-loader
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
