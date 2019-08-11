/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (_, argv) => {
  const GAME_INFO = {
    title: 'First-Person Tetris',
    shortTitle: 'FP Tetris',
    description: "It's First-Person Tetris!",
    themeColor: '#000000',
    bgColor: '#000000',
    gAnalyticsID: process.env['GANALYTICS_ID'],
  }

  const mode = argv.mode || 'production'

  const tsLoader = {
    loader: 'ts-loader',
  }

  const fileLoader = {
    loader: 'file-loader',
    options: {
      name() {
        return (mode === 'production')
          ? 'assets/[sha512:hash:base64:7].[ext]'
          : '[path][name].[ext]'
      },
    },
  }

  const useCss = ['css-loader']

  // Common config
  const config = {
    // Development or Production mode
    mode,
    // Handle bootstrap script alone
    entry: {
      bootstrap: './src/bootstrap/index.ts',
    },
    // Tell webpack to use typescript loader
    module: {
      rules: [{
        test: /\.css$/i,
        use: useCss,
      }, {
        test: /\.(ico|svg|png|jpg|gif|mp3|woff|woff2)$/i,
        use: fileLoader,
      }, {
        test: /\.ts$/i,
        use: tsLoader,
      }],
    },
    // Resolve .ts then .js files when extension is not supplied
    // Resolve files in 'src' directory
    resolve: {
      extensions: ['.ts', '.js', '.gif'],
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    },
    // Output files as dist/runtime/<module/chunk name>.js
    output: {
      filename: 'runtime/[chunkhash:7].js',
      chunkFilename: 'runtime/[chunkhash:7].js',
      path: path.resolve(__dirname, 'dist'),
    },
    // Use only one chunk for runtime,
    // Use *webpackChunkName* comments when separate chunks are needed
    // https://webpack.js.org/guides/code-splitting/#dynamic-imports
    optimization: {
      runtimeChunk: 'single',
    },
    // Load some webpack plugins
    plugins: [
      new CleanWebpackPlugin(),
      new webpack.HashedModuleIdsPlugin(),
      new HtmlWebpackPlugin({
        info: GAME_INFO,
        filename: 'index.html',
        template: 'src/templates/index.html',
        minify: {
          collapseWhitespace: (mode === 'production'),
          minifyJS: (mode === 'production'),
          minifyCSS: (mode === 'production') && { level: 2 },
        },
      }),
      new HtmlWebpackPlugin({
        info: GAME_INFO,
        filename: 'manifest.json',
        template: 'src/templates/manifest.json.html',
        inject: false,
        minify: {
          collapseWhitespace: (mode === 'production'),
        },
      }),
      new HtmlWebpackPlugin({
        info: GAME_INFO,
        filename: 'browserconfig.xml',
        template: 'src/templates/browserconfig.xml.html',
        inject: false,
        minify: {
          collapseWhitespace: (mode === 'production'),
        },
      }),
      new webpack.DefinePlugin({
        __DEV__: (mode === 'production') ? 'false' : 'true',
      }),
    ],
  }

  if (mode === 'production') {
    // Production-only flags
    Object.assign(config, {
      optimization: {
        ...config.optimization,
        splitChunks: {
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
        minimizer: [
          new TerserPlugin({
            parallel: true,
            terserOptions: {
              compress: {
                // 'drop_console': true,
              },
              output: {
                comments: false,
              },
            },
          }),
        ],
      },
      plugins: [
        ...config.plugins,
        new WorkboxPlugin.GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          importWorkboxFrom: 'local',
        }),
      ],
    })
  } else {
    // Dev-only config
    Object.assign(config, {
      devtool: 'inline-source-map',
      watch: true,
      devServer: {
        contentBase: './dist',
      },
      output: {
        ...config.output,
        filename: 'runtime/[name].js',
        chunkFilename: 'runtime/[name].js',
      },
    })

    tsLoader.options = {
      transpileOnly: true,
      experimentalWatchApi: true,
    }
  }

  return config
}
