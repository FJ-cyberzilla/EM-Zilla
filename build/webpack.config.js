const path = require('path');
const JavaScriptObfuscator = require('webpack-obfuscator');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    
    return {
        mode: isProduction ? 'production' : 'development',
        entry: {
            app: './js/app.js',
            security: './security/integrity-verifier.js',
            ai: './js/ai-orchestrator.js'
        },
        output: {
            path: path.resolve(__dirname, '../dist'),
            filename: isProduction ? '[name].[contenthash].js' : '[name].js',
            clean: true
        },
        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        mangle: {
                            reserved: ['$', 'jQuery', 'IntegrityVerifier', 'RuntimeGuard']
                        },
                        compress: {
                            drop_console: isProduction,
                            drop_debugger: isProduction
                        }
                    }
                })
            ],
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all'
                    },
                    security: {
                        test: /[\\/]security[\\/]/,
                        name: 'security-core',
                        chunks: 'all'
                    }
                }
            }
        },
        plugins: isProduction ? [
            new JavaScriptObfuscator({
                rotateStringArray: true,
                stringArray: true,
                stringArrayThreshold: 0.75,
                splitStrings: true,
                splitStringsChunkLength: 10,
                identifierNamesGenerator: 'hexadecimal',
                transformObjectKeys: true,
                numbersToExpressions: true,
                simplify: true,
                shuffleStringArray: true,
                target: 'browser'
            }, ['excluded_bundle_name.js'])
        ] : [],
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                            plugins: [
                                ['@babel/plugin-transform-modules-commonjs'],
                                ['@babel/plugin-proposal-private-methods', { loose: true }]
                            ]
                        }
                    }
                }
            ]
        },
        devtool: isProduction ? false : 'source-map'
    };
};
