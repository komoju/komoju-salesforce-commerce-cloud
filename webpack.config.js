var path = require('path');
var ExtractTextPlugin = require('sgmf-scripts')['extract-text-webpack-plugin'];
var sgmfScripts = require('sgmf-scripts');
var CopyPlugin = require('copy-webpack-plugin');

module.exports = [{
  mode: 'production',
  name: 'js',
  entry: sgmfScripts.createJsPath(),
  output: {
    path: path.resolve('./cartridges/int_komoju_sfra/cartridge/static'),
    filename: '[name].js'
  }
}, {
  mode: 'none',
  name: 'scss',
  entry: sgmfScripts.createScssPath(),
  output: {
    path: path.resolve('./cartridges/int_komoju_sfra/cartridge/static'),
    filename: '[name].css'
  },
  module: {
    rules: [{
      test: /\.scss$/,
      use: ExtractTextPlugin.extract({
        use: [{
          loader: 'css-loader',
          options: {
            url: false
          }
        }, {
          loader: 'postcss-loader',
          options: {
            plugins: [
              require('autoprefixer')()
            ]
          }
        }, {
          loader: 'sass-loader',
          options: {
            includePaths: [
              path.resolve(
                                process.cwd(),
                                '../storefront-reference-architecture-6.0.0/node_modules/'
                            ),
              path.resolve(
                                process.cwd(),
                                '../storefront-reference-architecture-6.0.0/node_modules/flag-icon-css/sass'
                            )]
          }
        }]
      })
    }]
  },
  plugins: [
    new ExtractTextPlugin({ filename: '[name].css' })
  ]
}];
