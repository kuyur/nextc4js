/**
 * @author kuyur@kuyur.info
 */

'use strict';

var fs = require('fs');
var { Context } = require('./context');
var goog = require('./goog-base');

/**
 * Create a Context instance by loading configuration from a JSON file. (for node.js)
 * @param {string} filePath file path of configuration.
 * @return {Promise.<Context>}
 */
exports.loadFromJson = function(filePath) {
  // TODO
  return null;
};

/**
 * Create a Context instance by loading configuration from a JSON file synchronously. (for node.js)
 * @param {string} filePath file path of configuration.
 * @return {Context}
 */
exports.loadFromJsonSync = function(filePath) {
  var json = fs.readFileSync(filePath, {
    encoding: 'utf-8'
  });
  var configs = JSON.parse(json);

  if (configs) {
    var loadBuffer = function(option) {
      if (goog.isString(option.buffer)) {
        var parts = option.buffer.split('|');
        var bytes = +parts[1];
        var charmap = fs.readFileSync(parts[0]);
        option.buffer = bytes === 2 ? new Uint16Array(charmap.buffer) : new Uint32Array(charmap.buffer);
      }
    };

    // loop decoders
    if (goog.isArray(configs.decoders)) {
      configs.decoders.forEach(loadBuffer);
    }

    // loop encoders
    if (goog.isArray(configs.encoders)) {
      configs.encoders.forEach(loadBuffer);
    }

    // loop converters
    if (goog.isArray(configs.converters)) {
      configs.converters.forEach(loadBuffer);
    }
  }

  return new Context(configs);
};
