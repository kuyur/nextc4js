/**
 * @author kuyur@kuyur.net
 */

'use strict';

const { Charmap, CharmapType }= require('./charmap');
const consts = require('./consts');
const decodingrule = require('./decoding-rule');
const goog = require('./goog-base');
const base64 = require('./base64');

/**
 * Front-end Charmap class.
 * @constructor
 * @param {string} name
 * @extends {Charmap}
 */
var Decoder = function(name) {
  Charmap.call(this, name, CharmapType.DECODER);
};
goog.inherits(Decoder, Charmap);

/**
 * The rule of byte-reading.
 * @private
 * @type {decodingrule.DecodingRule}
 */
Decoder.prototype.rule_;

/**
 * Is the buffer matched the charmap or not.
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to test. 0 by default.
 * @return {boolean}
 */
Decoder.prototype.match = goog.abstractMethod;

/**
 * Decode the buffer and return Unicode code points. Use toString() method of
 * buffer-utils to convert the decoded buffer to string.
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
 * @return {Uint32Array}
 */
Decoder.prototype.decode = goog.abstractMethod;

/**
 * Decode the buffer and return JavaScript native string. Will remove the BOM
 * at the header if the BOM is existing.
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to parse. 0 by default.
 * @return {string}
 */
Decoder.prototype.parse = goog.abstractMethod;

/**
 * @constructor
 * @extends {Decoder}
 */
var DecoderUtf16le = function() {
  Decoder.call(this, 'UTF-16LE');
  this.rule_ = decodingrule.UTF16LE;
};
goog.inherits(DecoderUtf16le, Decoder);

/**
 * Is the buffer matched the charmap or not.
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to test. 0 by default.
 * @return {boolean}
 */
DecoderUtf16le.prototype.match = function(buffer, opt_offset) {
  return this.rule_.match(buffer, opt_offset);
};

/**
 * Test the first 2 bytes matching with UTF16-LE BOM or not.
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
DecoderUtf16le.prototype.hasBom = function(buffer) {
  return buffer && buffer.length >= 2 && buffer[0] === consts.UTF16LE_BOM[0] &&
    buffer[1] === consts.UTF16LE_BOM[1];
};

/**
 * Decode the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
 * @return {Uint32Array}
 */
DecoderUtf16le.prototype.decode = function(buffer, opt_offset) {
  return this.rule_.decode(buffer, opt_offset);
};

/**
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
 * @return {string}
 */
DecoderUtf16le.prototype.parse = function(buffer, opt_offset) {
  var result = this.rule_.parse(buffer, opt_offset);
  if (result && result.charCodeAt(0) === consts.UNICODE_BYTE_ORDER_MARK) {
    return result.substring(1);
  }
  return result;
};

/**
 * @constructor
 * @extends {Decoder}
 */
var DecoderUtf16be = function() {
  Decoder.call(this, 'UTF-16BE');
  this.rule_ = decodingrule.UTF16BE;
};
goog.inherits(DecoderUtf16be, Decoder);

/**
 * Is the buffer matched the charmap or not.
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to test. 0 by default.
 * @return {boolean}
 */
DecoderUtf16be.prototype.match = function(buffer, opt_offset) {
  return this.rule_.match(buffer, opt_offset);
};

/**
 * Test the first 2 bytes matching with UTF16-BE BOM or not.
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
DecoderUtf16be.prototype.hasBom = function(buffer) {
  return buffer && buffer.length >= 2 && buffer[0] === consts.UTF16BE_BOM[0] &&
    buffer[1] === consts.UTF16BE_BOM[1];
};

/**
 * Decode the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
 * @return {Uint32Array}
 */
DecoderUtf16be.prototype.decode = function(buffer, opt_offset) {
  return this.rule_.decode(buffer, opt_offset);
};

/**
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
 * @return {string}
 */
DecoderUtf16be.prototype.parse = function(buffer, opt_offset) {
  var result = this.rule_.parse(buffer, opt_offset);
  if (result && result.charCodeAt(0) === consts.UNICODE_BYTE_ORDER_MARK) {
    return result.substring(1);
  }
  return result;
};

/**
 * @constructor
 * @extends {Decoder}
 */
var DecoderUtf8 = function() {
  Decoder.call(this, 'UTF-8');
  this.rule_ = decodingrule.UTF8;
};
goog.inherits(DecoderUtf8, Decoder);

/**
 * Is the buffer matched the charmap or not.
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to test. 0 by default.
 * @return {boolean}
 */
DecoderUtf8.prototype.match = function(buffer, opt_offset) {
  return this.rule_.match(buffer, opt_offset);
};

/**
 * Test the first 3 bytes matching with UTF8 BOM or not.
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
DecoderUtf8.prototype.hasBom = function(buffer) {
  return buffer && buffer.length >= 3 && buffer[0] === consts.UTF8_BOM[0] &&
    buffer[1] === consts.UTF8_BOM[1] && buffer[2] === consts.UTF8_BOM[2];
};

/**
 * Decode the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
 * @return {Uint32Array}
 */
DecoderUtf8.prototype.decode = function(buffer, opt_offset) {
  return this.rule_.decode(buffer, opt_offset);
};

/**
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
 * @return {string}
 */
DecoderUtf8.prototype.parse = function(buffer, opt_offset) {
  var result = this.rule_.parse(buffer, opt_offset);
  if (result && result.charCodeAt(0) === consts.UNICODE_BYTE_ORDER_MARK) {
    return result.substring(1);
  }
  return result;
};

/**
 * Front-end MBCS Charmap class.
 * @param {{
 *   name: string,
 *   description: string,
 *   version: string,
 *   buffer: Uint16Array|Uint32Array|string,
 *   byte: ?number,
 *   rules: Array.<Object>,
 *   segments: Array.<Object>
 * }} options
 * @constructor
 * @extends {Decoder}
 */
var DecoderMultibyte = function(options) {
  if (!options || !options.name) {
    throw 'options should provide name property at least';
  }
  Decoder.call(this, options.name);

  this.description_ = options.description;
  this.version_ = options.version;

  var mappingBuffer = null;
  if (options.buffer) {
    if ((options.buffer instanceof Uint16Array) || (options.buffer instanceof Uint32Array)) {
      mappingBuffer = options.buffer;
    } else if (goog.isString(options.buffer)) {
      if (options.buffer.startsWith(consts.EMBEDDED_BASE64_PREFIX)) {
        var encoded = options.buffer.substring(consts.EMBEDDED_BASE64_PREFIX.length);
        var charmap = base64.decode(encoded.trim());
        mappingBuffer = options.byte === 2 ? new Uint16Array(charmap.buffer) : new Uint32Array(charmap.buffer);
      }
    }
  }

  this.rule_ = new decodingrule.Multibyte(options.rules, options.segments, mappingBuffer);
};
goog.inherits(DecoderMultibyte, Decoder);

/**
 * Get bytes of one code point inside mapping buffer.
 * @return {number}
 */
DecoderMultibyte.prototype.getBytesOfCodepoint = function() {
  return this.rule_.getBytesOfCodepoint();
};

/**
 * Is the buffer matched the MBCS charmap or not. If there is any code point
 * mapped to 0xFFFD, it is considered that buffer is not matched.
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to test. 0 by default.
 * @return {boolean}
 */
DecoderMultibyte.prototype.match = function(buffer, opt_offset) {
  return this.rule_.match(buffer, opt_offset);
};

/**
 * Decode the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
 * @return {Uint32Array}
 */
DecoderMultibyte.prototype.decode = function(buffer, opt_offset) {
  return this.rule_.decode(buffer, opt_offset);
};

/**
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
 * @return {string}
 */
DecoderMultibyte.prototype.parse = function(buffer, opt_offset) {
  return this.rule_.parse(buffer, opt_offset);
};

exports.UTF16LE = new DecoderUtf16le();
exports.UTF16BE = new DecoderUtf16be();
exports.UTF8 = new DecoderUtf8();
exports.Decoder = Decoder;
exports.Multibyte = DecoderMultibyte;
