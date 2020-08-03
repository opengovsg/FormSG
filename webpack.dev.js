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
          loader: 'babel-loader',
          exclude: /node_modules/,
          query: {
            compact: false,
          },
        },
      ],
    },
  }),
  merge(cssBundle, { mode: 'development' }),
]
