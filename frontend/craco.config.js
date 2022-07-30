/* eslint-env node */
const CracoAlias = require('craco-alias')
const merge = require('lodash/merge')
const path = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const customJestConfig = require('./jest.config')

module.exports = {
  jest: {
    configure: (jestConfig) => {
      const newConfig = merge({}, jestConfig, customJestConfig)
      return newConfig
    },
  },
  webpack: {
    alias: {
      'libphonenumber-js': path.resolve(
        __dirname,
        'node_modules/libphonenumber-js',
      ),
      jszip: path.resolve(__dirname, 'node_modules/jszip'),
      lodash: path.resolve(__dirname, 'node_modules/lodash'),
      validator: path.resolve(__dirname, 'node_modules/validator'),
      'date-fns': path.resolve(__dirname, 'node_modules/date-fns/esm'),
    },
    configure: {
      module: {
        rules: [
          {
            type: 'javascript/auto',
            test: /\.mjs$/,
            include: /node_modules/,
          },
        ],
      },
    },
    plugins: process.env.ANALYZE && [
      new BundleAnalyzerPlugin({ generateStatsFile: true }),
    ],
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
          /**
           * Utility to allow for referencing folders outside of create-react-app root. \
           * See https://github.com/facebook/create-react-app/issues/9127.
           *
           * Retrieved from https://gist.github.com/stevemu/53c5006c5e66fc277dea1454eb6acdb4.
           * bascially tells webpack to use babel-loader for specified paths
           */
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

          webpackConfig.module.rules.unshift({
            test: /\.worker\.ts$/,
            use: {
              loader: 'worker-loader',
              options: {
                filename: '[name].[contenthash:8].js',
              },
            },
          })

          return webpackConfig
        },
      },
    },
  ],
}
