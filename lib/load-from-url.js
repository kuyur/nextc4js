/**
 * @author kuyur@kuyur.info
 */

'use strict';

const { Context } = require('./context');
const goog = require('./goog-base');

/**
 * Create a Context instance by loading configuration from a URL. (for browser)
 * @param {string} url url of configuration file.
 * @return {Promise.<Context>}
 */
exports.loadFromUrl = function(url) {
  var promise = fetch(url).then(response => response.json());

  var loadBuffer = function(option) {
    if (goog.isString(option.buffer)) {
      var parts = option.buffer.split('|');
      var bytes = +parts[1];
      return fetch(parts[0]).then(response => response.arrayBuffer()).then(charmap => {
        option.buffer = bytes === 2 ? new Uint16Array(charmap) : new Uint32Array(charmap);
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
