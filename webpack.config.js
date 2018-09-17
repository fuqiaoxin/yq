var path = require('path');
var webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './assets/main.js',
    output: {
        path: path.resolve(__dirname, 'js'),
        filename: 'JCgame.js'
    }
}
