const path = require('path');
const { UserscriptPlugin } = require('webpack-userscript');
const dev = process.env.NODE_ENV === 'development';
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
    entry: './src/index.ts',
    mode: dev ? 'development' : 'production',
    cache: {
        type: 'memory', // Enable in-memory caching
        cacheUnaffected: true, // Cache modules that are not affected by changes
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery'",
            "window.$": "jquery"
        }),
        new UserscriptPlugin({
            headers: {
                name: 'Declare War',
                namespace: 'http://tampermonkey.net/',
                version: '0.1',
                description: 'War type in URL, default war type button, captcha autofill, captcha solver, auto declare war, war declare auto redirect',
                author: 'Borg',
                match: [
                    '*://*politicsandwar.com/*',
                    '*://*/recaptcha/*'
                ],
                grant: [
                    'GM_setValue',
                    'GM_getValue',
                    'GM_addValueChangeListener',
                    'GM_xmlhttpRequest',
                    'GM_getResourceText',
                    'GM_addStyle'
                ],
                icon: 'https://raw.githubusercontent.com/xdnw/lc_stats_svelte/refs/heads/main/static/favicon-large.webp',
                connect: [
                    'engageub.pythonanywhere.com',
                    'engageub1.pythonanywhere.com'
                ],
                updateURL: 'https://github.com/xdnw/borgscripts/raw/refs/heads/main/dist/locutus.user.js',
                downloadURL: 'https://github.com/xdnw/borgscripts/raw/refs/heads/main/dist/locutus.user.js',
                license: 'MIT',
                // require: [
                //     'https://code.jquery.com/jquery-3.7.1.min.js',
                //     'https://code.jquery.com/ui/1.14.1/jquery-ui.min.js',
                // ],
                resource: {
                    jqueryui: 'https://code.jquery.com/ui/1.14.1/themes/base/jquery-ui.css'
                }
            },
            pretty: true,
            strict: true,
            whitelist: true
        })
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        modules: [path.resolve(__dirname, 'src'), 'node_modules'], // Optimize module resolution
    },
    optimization: {
        minimize: !dev,
        minimizer: !dev ? [new TerserPlugin({
            parallel: true, // Enable parallel processing
        })] : [],
    },
    output: {
        filename: 'locutus.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
        hot: true, // Enable hot module replacement
    },
};