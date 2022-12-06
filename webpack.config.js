// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const stylesHandler = 'style-loader';
const extPath = "BenSrsExt/Shared (Extension)/Resources"


const config = {
    entry: {
        main: './src/index.tsx',
        [path.join(extPath, "content")]: './src/ext/content.ts',
        [path.join(extPath, "popup")]: './src/ext/popup.tsx',
        [path.join(extPath, "background")]: './src/ext/background.ts',
    },
    output: {
        path: path.resolve(__dirname, 'docs'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: '弁SrS',
            chunks: ['main'],
            filename: 'index.html',
        }),
        new HtmlWebpackPlugin({
            title: '弁SrS',
            chunks: [path.join(extPath, "popup")],
            filename: path.join(extPath, 'popup.html'),
            inject: false,
            templateContent: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>弁SrS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body>
  <script src="popup.js"></script></body>
</html>`
        }),
        new WorkboxPlugin.GenerateSW({
            // these options encourage the ServiceWorkers to get in there fast
            // and not allow any straggling "old" SWs to hang around
            clientsClaim: true,
            skipWaiting: true,
            cleanupOutdatedCaches: true,
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        }),
    ],
    module: {
        rules: [
            {
                loader: 'babel-loader',

                // Skip any files outside of your project's `src` directory
                include: [
                    path.resolve(__dirname, 'src/'),
                ],

                // Only run `.js`, `.jsx`, `.ts`, and `.tsx` files through Babel
                test: /\.(js|ts)x?$/
            },

            {
                test: /\.css$/i,
                use: [stylesHandler, 'css-loader'],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset',
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            "util": require.resolve("util/"),
            "crypto": require.resolve("crypto-browserify"),
            "buffer": require.resolve("buffer/"),
            "stream": require.resolve("stream-browserify"),
        }
    },
};

module.exports = () => {
    config.mode = 'production';
    return config;
};
