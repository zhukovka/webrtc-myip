var path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
module.exports = {
    entry: {
        'webrtc-myip': './src/RTC.ts',
        'webrtc-myip.min': './src/RTC.ts'
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                sourceMap: true,
                include: /\.min\.js$/,
                uglifyOptions: {
                    ecma: 6
                }
            }),
        ],
    },
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: '[name].js',
        library: 'WebRTC',
        libraryTarget: 'umd',
    }
};