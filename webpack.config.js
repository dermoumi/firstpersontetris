/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = (env, argv) => {
  const mode = argv.mode || 'production'

  const tsLoader = {
    loader: 'ts-loader',
  }

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
        test: /\.(png|jpg|gif|mp3|woff|woff2)$/i,
        exclude: /node_modules/,
        use: {
          loader: 'file-loader',
          options: {
            name() {
              return (argv.mode === 'development')
                ? '[path][name].[ext]'
                : 'content/[sha512:hash:base64:7].[ext]'
            },
          },
        },
      }, {
        test: /\.ts$/i,
        exclude: /node_modules/,
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
      filename: 'runtime/[name].js',
      chunkFilename: 'runtime/[name].js',
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
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [
          '**/*',
          '!assets',
          '!assets/**/*',
          '!index.html',
          '!manifest.json',
          '!browserconfig.xml',
          '!favicon.ico',
        ],
      }),
      new webpack.HashedModuleIdsPlugin(),
    ],
  }

  if (argv.mode === 'development') {
    // Dev-only config
    Object.assign(config, {
      devtool: 'inline-source-map',
      watch: true,
      devServer: {
        contentBase: './dist',
      },
      plugins: [
        ...config.plugins,
        new webpack.DefinePlugin({
          __DEV__: 'true',
        }),
      ],
    })

    tsLoader.options = {
      transpileOnly: true,
      experimentalWatchApi: true,
    }
  } else {
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
        minimizer: [new TerserPlugin({
          parallel: true,
          terserOptions: {
            compress: {
              'drop_console': true,
            },
            output: {
              comments: false,
            },
          },
        })],
      },
      plugins: [
        ...config.plugins,
        new webpack.DefinePlugin({
          __DEV__: 'false',
        }),
        new WorkboxPlugin.GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          globDirectory: './dist',
          globPatterns: [ '**/*.{js,css,html,gif,png,jpg,woff,woff2,mp3}' ],
        }),
      ],
    })
  }

  return config
}
