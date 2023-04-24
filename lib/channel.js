/**
 * @author kuyur@kuyur.net
 */

'use strict';

const goog = require('./goog-base');

/**
 * Channel class. A channel must have a decoder and an encoder at least.
 * Converters are optional.
 * @constructor
 * @param {Decoder} decoder
 * @param {Encoder} encoder
 * @param {(Array.<Converter>|Converter)=} opt_converters
 */
var Channel = function(decoder, encoder, opt_converters) {
  this.decoder_ = decoder;
  this.encoder_ = encoder;
  if (opt_converters) {
    this.converters_ = goog.isArray(opt_converters) ? opt_converters.slice() : [opt_converters];
  }
};

/**
 * @private
 * @type {Decoder}
 */
Channel.prototype.decoder_;

/**
 * @private
 * @type {Encoder}
 */
Channel.prototype.encoder_;

/**
 * @private
 * @type {Array.<Converter>}
 */
Channel.prototype.converters_;

/**
 * Can the source buffer be decoded in the channel.
 * @param {Uint8Array} buffer
 */
Channel.prototype.match = function(buffer) {
  return this.decoder_.match(buffer);
};

/**
 * Process (decoding, converting and then encoding) the source buffer and
 * output processed result.
 * @param {Uint8Array} buffer
 * @return {?Uint8Array}
 */
Channel.prototype.process = function(buffer) {
  var buf = this.decoder_.decode(buffer);
  if (!buf) {
    return null;
  }

  if (this.converters_) {
    this.converters_.forEach(function(converter) {
      buf = converter.convert(buf);
    }, this);
  }

  return this.encoder_.encode(buf);
};

exports.Channel = Channel;
