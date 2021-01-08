const merge = require('webpack-merge')
const [jsBundle, cssBundle] = require('./webpack.common.js')

module.exports = [
  merge(jsBundle, {
    mode: 'development',
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: [/node_modules/, /@babel(?:\/|\\{1,2})runtime|core-js/],
          use: {
            loader: 'babel-loader',
          },
        },
      ],
    },
  }),
  merge(cssBundle, { mode: 'development' }),
]
