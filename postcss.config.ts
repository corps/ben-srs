// https://github.com/tachyons-css/tachyons-build-css/blob/master/index.js
declare var require: any;

var perfect = require('perfectionist');
var atImport = require('postcss-import');
var media = require('postcss-custom-media');
var vars = require('postcss-css-variables');
var conditionals = require('postcss-conditionals');
var rmComments = require('postcss-discard-comments');
var prefixer = require('autoprefixer');
var queries = require('css-mqpacker');
var cssnano = require('cssnano');

export = {
  plugins: [
    atImport(),
    vars(),
    conditionals(),
    media(),
    queries(),
    perfect({format: 'compact', trimTrailingZeros: false}),
    prefixer(),
    rmComments(),
    cssnano()
  ]
};