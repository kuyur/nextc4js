/**
 * @author kuyur@kuyur.info
 */

'use strict';

const { Charmap, CharmapType } = require('./charmap');
const consts = require('./consts');
const encodingrule = require('./encoding-rule');
const goog = require('./goog-base');

/**
 * Back-end Charmap class.
 * @constructor
 * @param {string} name
 * @extends {Charmap}
 */
var Encoder = function(name) {
  Charmap.call(this, name, CharmapType.ENCODER);
};
goog.inherits(Encoder, Charmap);

/**
 * @private
 * @type {encodingrule.EncodingRule}
 */
Encoder.prototype.rule_;

/**
 * Encode the Unicode code points and return encoded buffer.
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
Encoder.prototype.encode = goog.abstractMethod;

/**
 * @constructor
 * @extends {Encoder}
 */
var EncoderUtf16le = function() {
  Encoder.call(this, 'UTF-16LE');
  this.rule_ = encodingrule.UTF16LE;
};
goog.inherits(EncoderUtf16le, Encoder);

/**
 * @override
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
EncoderUtf16le.prototype.encode = function(buffer) {
  return this.rule_.encode(buffer);
};

/**
 * @constructor
 * @extends {Encoder}
 */
var EncoderUtf16be = function() {
  Encoder.call(this, 'UTF-16BE');
  this.rule_ = encodingrule.UTF16BE;
};
goog.inherits(EncoderUtf16be, Encoder);

/**
 * @override
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
EncoderUtf16be.prototype.encode = function(buffer) {
  return this.rule_.encode(buffer);
};

/**
 * @constructor
 * @extends {Encoder}
 */
var EncoderUtf8 = function() {
  Encoder.call(this, 'UTF-8');
  this.rule_ = encodingrule.UTF8;
};
goog.inherits(EncoderUtf8, Encoder);

/**
 * @override
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
EncoderUtf8.prototype.encode = function(buffer) {
  return this.rule_.encode(buffer);
};

/**
 * Multibyte Encoder class.
 * @param {{
 *   name: string,
 *   description: string,
 *   version: string,
 *   buffer: Uint16Array|Uint32Array,
 *   segments: Array.<Object>
 * }} options
 * @extends {Encoder}
 */
var EncoderMultibyte = function(options) {
  if (!options || !options['name']) {
    throw 'options should provide name property at least';
  }
  Encoder.call(this, options['name']);

  this.description_ = options['description'];
  this.version_ = options['version'];
  this.rule_ = new encodingrule.Multibyte(options['segments'],
    options['buffer'], consts.MBCS_UNKNOWN_CHAR);
};
goog.inherits(EncoderMultibyte, Encoder);

/**
 * Get bytes of one code point inside mapping buffer.
 * @return {number}
 */
EncoderMultibyte.prototype.getBytesOfCodepoint = function() {
  return this.rule_.getBytesOfCodepoint();
};

/**
 * @override
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
EncoderMultibyte.prototype.encode = function(buffer) {
  return this.rule_.encode(buffer);
};

exports.UTF16LE = new EncoderUtf16le();
exports.UTF16BE = new EncoderUtf16be();
exports.UTF8 = new EncoderUtf8();
exports.Encoder = Encoder;
exports.Multibyte = EncoderMultibyte;
