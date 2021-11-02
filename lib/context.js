/**
 * @author kuyur@kuyur.info
 */

'use strict';

const { Channel } = require('./channel');
const { Converter } = require('./converter');
const decoder = require('./decoder');
const encoder = require('./encoder');
const goog = require('./goog-base');

/**
 * Context Class.
 * @constructor
 * @param {Object} configs
 */
var Context = function(configs) {
  this.reload(configs);
};

/**
 * @type {Object.<string, encoder.Encoder>}}
 * @private
*/
Context.prototype.encoders_;

/**
 * @type {Object.<string, decoder.Decoder>}
 * @private
 */
Context.prototype.decoders_;

/**
 * @type {Object.<string, Converter>}
 * @private
 */
Context.prototype.converters_;

/**
 * @type {Object.<string, Channel>}
 * @private
 */
Context.prototype.channels_;

/**
 * @type {Array.<string>}
 * @private
 */
Context.prototype.detectionOrder_;

/**
 * Reload configuration.
 * @param {Object} configs
 */
Context.prototype.reload = function(configs) {
  this.decoders_ = {};
  this.decoders_[decoder.UTF8.getName()] = decoder.UTF8;
  this.decoders_[decoder.UTF16LE.getName()] = decoder.UTF16LE;
  this.decoders_[decoder.UTF16BE.getName()] = decoder.UTF16BE;


  this.encoders_ = {};
  this.encoders_[encoder.UTF8.getName()] = encoder.UTF8;
  this.encoders_[encoder.UTF16LE.getName()] = encoder.UTF16LE;
  this.encoders_[encoder.UTF16BE.getName()] = encoder.UTF16BE;

  this.converters_ = {};
  this.detectionOrder_ = [];
  this.channels_ = {};

  if (configs) {
    // external decoders
    if (goog.isArray(configs.decoders)) {
      configs.decoders.forEach(config => {
        var dec = new decoder.Multibyte(config);
        this.decoders_[dec.getName()] = dec;
      }, this);
    }

    // detection order
    if (goog.isArray(configs.detection_order)) {
      this.detectionOrder_ = configs.detection_order.slice();
    }

    // external encoders
    if (goog.isArray(configs.encoders)) {
      configs.encoders.forEach(config => {
        var enc = new encoder.Multibyte(config);
        this.encoders_[enc.getName()] = enc;
      }, this);
    }

    // external converters
    if (goog.isArray(configs.converters)) {
      configs.converters.forEach(config => {
        var conv = new Converter(config);
        this.converters_[conv.getName()] = conv;
      }, this);
    }

    // channels
    if (goog.isArray(configs.channels)) {
      configs.channels.forEach(config => {
        this.newChannel(config.name, config.decoder, config.encoder, config.converters);
      }, this);
    }
  }
};

/**
 * Get decoder by name.
 * @param {string} name
 * @return {?decoder.Decoder}
 */
Context.prototype.getDecoder = function(name) {
  return this.decoders_[name];
};

/**
 * Get name list of all decoders.
 * @return {Array.<string>}
 */
Context.prototype.getDecoderNames = function() {
  return Object.keys(this.decoders_);
};

/**
 * Get encoder by name.
 * @param {string} name
 * @return {?encoder.Encoder}
 */
Context.prototype.getEncoder = function(name) {
  return this.encoders_[name];
};

/**
 * Get name list of all encoders.
 * @return {Array.<string>}
 */
Context.prototype.getEncoderNames = function() {
  return Object.keys(this.encoders_);
};

/**
 * Get converter by name.
 * @param {string} name
 * @return {?Converter}
 */
Context.prototype.getConverter = function(name) {
  return this.converters_[name];
};

/**
 * Get name list of all converters.
 * @return {Array.<string>}
 */
Context.prototype.getConverterNames = function() {
  return Object.keys(this.converters_);
};

/**
 * Get channel by name.
 * @param {string} name
 * @return {?Channel}
 */
Context.prototype.getChannel = function(name) {
  return this.channels_[name];
};

/**
 * Get name list of all channels.
 * @return {Array.<string>}
 */
Context.prototype.getChannelNames = function() {
  return Object.keys(this.channels_);
};

/**
 * Create a new channel from existing charmaps.
 * @param {string} name name of the new channel.
 * @param {string} decoder name of decoder.
 * @param {string} encoder name of encoder.
 * @param {?(string|Array.<string>)} opt_converters name list of converters.
 * @return {?Channel}
 */
Context.prototype.newChannel = function(name, decoder, encoder, opt_converters) {
  if (!this.decoders_[decoder] || !this.encoders_[encoder]) {
    return null;
  }

  var converters = [];
  if (opt_converters) {
    if (goog.isString(opt_converters)) {
      if (this.converters_[opt_converters]) {
        converters.push(this.converters_[opt_converters]);
      }
    } else if (goog.isArray(opt_converters)) {
      opt_converters.forEach(name => {
        if (this.converters_[name]) {
          converters.push(this.converters_[name]);
        }
      }, this);
    }
  }

  return this.channels_[name] = new Channel(this.decoders_[decoder], this.encoders_[encoder], converters);
};

/**
 * Guess the possible encoding (name of decoder) of input buffer. If not found, will
 * return null. The detection order is : UTF8 (w/o BOM) -> UTF16LE with BOM ->
 * UTF16BE with BOM -> external charmaps.
 * @param {Uint8Array} buffer input buffer.
 * @return {?{
 *   encoding: string,
 *   hasBom: boolean
 * }}
 */
Context.prototype.findPossibleEncoding = function(buffer) {
  if (decoder.UTF8.match(buffer)) {
    return {
      encoding: decoder.UTF8.getName(),
      hasBom: decoder.UTF8.hasBom(buffer)
    };
  }

  if (decoder.UTF16LE.hasBom(buffer) && decoder.UTF16LE.match(buffer)) {
    return {
      encoding: decoder.UTF16LE.getName(),
      hasBom: true
    };
  }

  if (decoder.UTF16BE.hasBom(buffer) && decoder.UTF16BE.match(buffer)) {
    return {
      encoding: decoder.UTF16BE.getName(),
      hasBom: true
    };
  }

  var found = this.detectionOrder_.find(name => {
    var dec = this.getDecoder(name);
    return dec && dec.match(buffer);
  }, this);

  if (found) {
    return {
      encoding: found,
      hasBom: false
    };
  }

  return null;
};

exports.Context = Context;
