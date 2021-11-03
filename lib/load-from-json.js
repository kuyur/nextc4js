/**
 * @author kuyur@kuyur.info
 */

'use strict';

const fs = require('fs');
const { Context } = require('./context');
const goog = require('./goog-base');

/**
 * Read file and return a Promise result.
 * @param {string|number} file filename or file descriptor.
 * @param {(Object|string)=} options
 * @return {Promise.<string>}
 */
var readFile = function(file, options) {
  return new Promise(function(resolve, reject) {
    fs.readFile(file, options, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Create a Context instance by loading configuration from a JSON file. (for node.js)
 * @param {string} filePath file path of configuration.
 * @return {Promise.<Context>}
 */
exports.loadFromJson = function(filePath) {
  var promise = readFile(filePath, {
    encoding: 'utf-8'
  }).then(json => {
    return JSON.parse(json);
  });

  var loadBuffer = function(option) {
    if (goog.isString(option.buffer)) {
      var parts = option.buffer.split('|');
      var bytes = +parts[1];
      return readFile(parts[0]).then(charmap => {
        option.buffer = bytes === 2 ? new Uint16Array(charmap.buffer) : new Uint32Array(charmap.buffer);
        return true;
      });
    }
  };

  promise = promise.then(configs => {
    var promises = [];

    // loop decoders
    if (goog.isArray(configs.decoders)) {
      configs.decoders.forEach(option => {
        promises.push(loadBuffer(option));
      });
    }

    // loop encoders
    if (goog.isArray(configs.encoders)) {
      configs.encoders.forEach(option => {
        promises.push(loadBuffer(option));
      });
    }

    // loop converters
    if (goog.isArray(configs.converters)) {
      configs.converters.forEach(option => {
        promises.push(loadBuffer(option));
      });
    }

    return Promise.all(promises).then(() => configs);
  });

  return promise.then(configs => {
    return new Context(configs);
  });
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