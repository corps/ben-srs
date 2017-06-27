declare var require: any;
declare var __dirname: string;

let path = require("path");
let webpack = require("webpack");
let CopyWebpackPlugin = require('copy-webpack-plugin');

var config: any = {
  entry: path.join(__dirname, "src/index.js"),
  output: {
    filename: 'index.js',
    path: path.join(__dirname, "build/index.js"),
    pathinfo: true
  },

  plugins: [
    new webpack.DefinePlugin({
      "process": "(" + JSON.stringify({env: {NODE_ENV: process.env.NODE_ENV}}) + ")"
    }),
    new CopyWebpackPlugin([{
      from: 'index.html',
      to: 'index.html'
    }]),
  ],

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader?importLoaders=1',
          'postcss-loader'
        ]
      },
      {
        test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?name=imgs/[name].[ext]&limit=10240'
      },
    ]
  },

  resolve: {
    extensions: ['.css', '.js'],
    modules: [
      "src",
      "css",
      "node_modules",
    ],
  },

  resolveLoader: {
    modules: ['node_modules']
  },

  devServer: {
    historyApiFallback: {
      index: '/index.html'
    }
  }
};

if (process.env.NODE_ENV === "production") {
  config.plugins.push(new webpack.LoaderOptionsPlugin({
    minimize: true
  }));

  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  }));
}

export = config;