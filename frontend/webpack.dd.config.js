/* eslint-disable */
// Webpack config to bundle datadog chunk to be loaded before rest of the react app
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    index_head: './datadog-chunk.ts', // _head suffix tells HtmlWebpackPlugin to inject this chunk into the head of index.html
  },
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
    filename: 'datadog-chunk.[contenthash].js',
    path: path.resolve('static/js'),
  },
  // inject the datadog chunk filename into the head of the existing index.html and overwrites index.html
  plugins: [
    new HtmlWebpackPlugin({
      filename: path.resolve('public/index.html'),
      template: path.resolve('public/index.html'),
      inject: 'head',
      minify: false, // Retain non-minified html formatting for readability
      chunks: ['index_head'],
    }),
  ],
}
