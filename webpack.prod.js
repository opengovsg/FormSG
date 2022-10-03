const merge = require('webpack-merge')
const TerserPlugin = require('terser-webpack-plugin')

const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const [jsBundle, cssBundle] = require('./webpack.common.js')

module.exports = [
  merge(jsBundle, {
    devtool: 'source-map',
    mode: 'production',
    optimization: {
      minimize: true,
      usedExports: true,
      sideEffects: false,
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: true,
          terserOptions: {
            ecma: 5,
            mangle: true,
            compress: true,
            toplevel: true,
            safari10: true,
            output: {
              comments: false,
            },
          },
        }),
      ],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          // Don't transpile polyfills
          exclude:
            /@babel(?:\/|\\{1,2})runtime|core-js|web-streams-polyfill|whatwg-fetch|abortcontroller-polyfill|text-encoding/,
          use: {
            loader: 'babel-loader',
          },
        },
      ],
    },
  }),
  merge(cssBundle, {
    mode: 'production',
    optimization: {
      minimizer: [new OptimizeCSSAssetsPlugin()],
    },
  }),
]
