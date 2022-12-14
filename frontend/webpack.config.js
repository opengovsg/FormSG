/* eslint-disable */
// Webpack config to bundle datadog chunk to be loaded before rest of the react app
const path = require('path')

module.exports = {
  entry: './datadog-chunk.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.dd.json',
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'datadog-chunk.js',
    path: path.resolve('../dist/frontend/static/js'),
  },
}
