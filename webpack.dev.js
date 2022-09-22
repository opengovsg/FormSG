const { merge } = require('webpack-merge')
const [jsBundle, cssBundle] = require('./webpack.common.js')

module.exports = [
  merge(jsBundle, {
    mode: 'development',
    devtool: 'source-map',
  }),
  merge(cssBundle, { mode: 'development' }),
]
