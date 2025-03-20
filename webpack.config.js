const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    renderer: './src/renderer/renderer.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    fallback: {
      'path': require.resolve('path-browserify'),
      'fs': false,
      'os': require.resolve('os-browserify/browser'),
    }
  },
  devtool: 'source-map'
}; 