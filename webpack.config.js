// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const stylesHandler = 'style-loader';


const config = {
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'docs'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'BEN-SRS',
        }),
        new WorkboxPlugin.GenerateSW({
            // these options encourage the ServiceWorkers to get in there fast
            // and not allow any straggling "old" SWs to hang around
            clientsClaim: true,
            skipWaiting: true,
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
    if (isProduction) {
        config.mode = 'production';
    } else {
        config.mode = 'development';
    }

    return config;
};
