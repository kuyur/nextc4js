/**
 * @author kuyur@kuyur.info
 */

'use strict';

const { Context } = require('./context');
const goog = require('./goog-base');
const consts = require('./consts');

/**
 * Create a Context instance by loading configuration from a URL. (for browser)
 * @param {string} url url of configuration file.
 * @return {Promise.<Context>}
 */
exports.loadFromUrl = function(url) {
  var promise = fetch(url).then(response => response.json());

  var loadBuffer = function(option) {
    if (goog.isString(option.buffer) && !option.buffer.startsWith(consts.EMBEDDED_BASE64_PREFIX)) {
      return fetch(option.buffer).then(response => response.arrayBuffer()).then(charmap => {
        option.buffer = option.byte === 2 ? new Uint16Array(charmap) : new Uint32Array(charmap);
      });
    } else {
      return Promise.resolve();
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
