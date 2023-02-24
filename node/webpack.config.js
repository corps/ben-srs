// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const stylesHandler = 'style-loader';


const config = {
    entry: {
        main: './react_app/index.tsx',
    },
    output: {
        path: path.resolve(__dirname, 'docs'),
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        fallback: {
            "util": require.resolve("util"),
            "crypto": require.resolve("crypto-browserify"),
            "buffer": require.resolve("buffer"),
            "stream": require.resolve("stream-browserify"),
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: '弁SrS',
            chunks: ['main'],
            filename: 'index.html',
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
                    path.resolve(__dirname, 'react_app/'),
                    path.resolve(__dirname, 'shared/'),
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
};

module.exports = () => {
    config.mode = 'production';
    return config;
};
