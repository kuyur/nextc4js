/**
 * @author kuyur@kuyur.info
 */

'use strict';

var charmap = require('./charmap');
var consts = require('./consts');
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
Encoder.prototype.encode = goog.abstractMethod;

/**
 * @constructor
 * @extends {Encoder}
 */
var EncoderUtf16le = function() {
  Encoder.call(this, 'UTF-16 (little-endian');
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
  Encoder.call(this, 'UTF-16 (little-endian');
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
 * Doublebyte Encoder class.
 * @param {Object} options
 * @param {Uint16Array|Uint32Array} mappingBuffer
 * @extends {Encoder}
 */
var EncoderMultiplebyte = function(options, mappingBuffer) {
  if (!options || !options['name']) {
    throw 'options should provide name property at least';
  }
  Encoder.call(this, options['name']);
  var name = options['name'].toLowerCase();
  name = name.substring(0, name.indexOf('-encoder'));

  this.description_ = options['description'];
  this.version_ = options['version'];
  this.rule_ = new encodingrule.EncodingRuleMultiplebyte(options['segments'],
    mappingBuffer, consts.MBCS_WHITE_SPACE[name.toUpperCase()]);
};
goog.inherits(EncoderMultiplebyte, Encoder);

/**
 * @override
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
EncoderMultiplebyte.prototype.encode = function(buffer) {
  return this.rule_.encode(buffer);
};

exports.UTF16LE = new EncoderUtf16le();
exports.UTF16BE = new EncoderUtf16be();
exports.UTF8 = new EncoderUtf8();
exports.Multiplebyte = EncoderMultiplebyte;
