/**
 * @author kuyur@kuyur.info
 */

'use strict';

var charmap = require('./charmap');
var encodingrule = require('./encoding-rule');
var goog = require('./goog-base');

/**
 * Back-end Charmap class.
 * @constructor
 * @param {string} name
 * @extends {charmap.Charmap}
 */
var Encoder = function(name) {
  charmap.Charmap.call(this, name, charmap.CharmapType.ENCODER);
};
goog.inherits(Encoder, charmap.Charmap);

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
Encoder.prototype.convert = goog.abstractMethod;

/**
 * @constructor
 * @extends {Encoder}
 */
var EncoderUtf16le = function() {
  Encoder.call(this, 'UTF-16 (little-endian');
  this.rule_ = encodingrule.UTF16LE;
};
goog.base(EncoderUtf16le, Encoder);

/**
 * @override
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
EncoderUtf16le.prototype.convert = function(buffer) {
  return this.rule_.encode(buffer);
};

/**
 * @constructor
 * @extends {Encoder}
 */
var EncoderUtf16be = function() {
  Encoder.call(this, 'UTF-16 (little-endian');
  this.rule_ = encodingrule.UTF16BE;
};
goog.base(EncoderUtf16be, Encoder);

/**
 * @override
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
EncoderUtf16be.prototype.convert = function(buffer) {
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
goog.base(EncoderUtf8, Encoder);

/**
 * @override
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
EncoderUtf8.prototype.convert = function(buffer) {
  return this.rule_.encode(buffer);
};

exports.UTF16LE = new EncoderUtf16le();
exports.UTF16BE = new EncoderUtf16be();
exports.UTF8 = new EncoderUtf8();
