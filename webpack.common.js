const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const GoogleFontsPlugin = require('google-fonts-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = [
  // Javascript / HTML config
  {
    entry: [path.resolve(__dirname, 'src/public/main.js')],
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            configFile: 'ts-loader-config.json',
          },
        },
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: {
            minimize: true,
          },
        },
        {
          test: /\.worker\.js$/,
          // Don't transpile polyfills
          exclude: /@babel(?:\/|\\{1,2})runtime|core-js/,
          use: [
            {
              loader: 'worker-loader',
              options: { publicPath: '/public/' },
            },
            {
              loader: 'babel-loader',
            },
          ],
        },
      ],
    },
    resolve: {
      alias: {
        shared: path.resolve(__dirname, 'src/shared/'),
      },
      extensions: ['.ts', '.js'],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'src/public/modules/core/img', to: 'modules/core/img' },
          {
            from: 'src/public/modules/forms/admin/img',
            to: 'modules/forms/admin/img',
          },
          { from: 'src/public/robots.txt', to: 'robots.txt' },
          { from: 'src/public/translations', to: 'translations' },
        ],
      }),
    ],
    output: {
      path: path.resolve(__dirname, 'dist/angularjs/'),
      filename: 'bundle.js',
    },
  },

  // CSS config
  {
    context: path.resolve(__dirname, 'src/public'),
    entry: './main.css',
    module: {
      rules: [
        {
          test: /\.(jpe?g|png|gif|svg)$/,
          loader: 'url-loader',
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[ext]',
          },
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, 'dist/angularjs/'),
      filename: 'bundle.css.js', // Throwaway file used by the CSS plugin
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: 'bundle.css' }),
      new GoogleFontsPlugin({
        fonts: [
          {
            family: 'Muli',
            variants: ['200', '300', '400', '600', '700'],
            subsets: ['latin'],
          },
          {
            family: 'Source Sans Pro',
            variants: ['300', '400', '600', '700', '900'],
            subsets: ['latin'],
          },
        ],
        formats: ['woff', 'woff2'],
      }),
    ],
  },
]
