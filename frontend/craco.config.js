const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser.js'), // <-- important: add ".js"
      };

      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser.js', // <-- match the fallback exactly
          Buffer: ['buffer', 'Buffer'],
        })
      );

      return webpackConfig;
    },
  },
};
