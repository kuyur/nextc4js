/**
 * @author kuyur@kuyur.info
 */

'use strict';

const { Charmap, CharmapType }= require('./charmap');
const consts = require('./consts');
const decodingrule = require('./decoding-rule');
const gb18030utils = require('./gb18030');
const goog = require('./goog-base');
const segment = require('./segment');
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
  return this.rule_.test(buffer, opt_offset) !== -1;
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
  return this.rule_.test(buffer, opt_offset) !== -1;
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
  return this.rule_.test(buffer, opt_offset) !== -1;
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
  this.rule_ = new decodingrule.Multibyte(options.rules);
  this.segments_ = new segment.Segments(options.segments);

  this.mappingBuffer_ = null;
  if (options.buffer) {
    if ((options.buffer instanceof Uint16Array) || (options.buffer instanceof Uint32Array)) {
      this.mappingBuffer_ = options.buffer;
    } else if (goog.isString(options.buffer)) {
      if (options.buffer.startsWith(consts.EMBEDDED_BASE64_PREFIX)) {
        var encoded = options.buffer.substring(consts.EMBEDDED_BASE64_PREFIX.length);
        var charmap = base64.decode(encoded.trim());
        this.mappingBuffer_ = options.byte === 2 ? new Uint16Array(charmap.buffer) : new Uint32Array(charmap.buffer);
      }
    }
  }
};
goog.inherits(DecoderMultibyte, Decoder);

/**
 * The mapping buffer to convert MBCS code point to Unicode code point.
 * The mapping buffer is storing Unicode code points in MBCS order.
 * @private
 * @type {Uint16Array|Uint32Array}
 */
DecoderMultibyte.prototype.mappingBuffer_;

/**
 * @private
 * @type {segment.Segments}
 */
DecoderMultibyte.prototype.segments_;

/**
 * Get bytes of one code point inside mapping buffer.
 * @return {number}
 */
DecoderMultibyte.prototype.getBytesOfCodepoint = function() {
  if (!this.mappingBuffer_) {
    return 0;
  }

  if (this.mappingBuffer_ instanceof Uint16Array) {
    return 2;
  }

  if (this.mappingBuffer_ instanceof Uint32Array) {
    return 4;
  }

  return 0;
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
  var decoded = this.rule_.decode(buffer, opt_offset);
  if (!decoded) {
    return false;
  }

  var chr;
  for (var i = 0, len = decoded.length; i < len; ++i) {
    chr = this.convertChar_(decoded[i]);
    if (chr === consts.UNICODE_UNKNOWN_CHAR) {
      return false;
    }
  }
  return true;
};

/**
 * Decode the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
 * @return {Uint32Array}
 */
DecoderMultibyte.prototype.decode = function(buffer, opt_offset) {
  var decoded = this.rule_.decode(buffer, opt_offset);
  if (!decoded) {
    return null;
  }

  var result = new Uint32Array(decoded.length);
  for (var i = 0, len = decoded.length; i < len; ++i) {
    result[i] = this.convertChar_(decoded[i]);
  }

  return result;
};

/**
 * Convert the MBCS code point to Unicode code point.
 * @private
 * @param {number} chr
 * @return {number}
 */
DecoderMultibyte.prototype.convertChar_ = function(chr) {
  chr = chr >>> 0;
  var seg = this.segments_.find(chr);
  if (!seg) {
    return consts.UNICODE_UNKNOWN_CHAR;
  }

  switch (seg.getReference()) {
    case segment.Reference.ASCII:
      return chr & 0x7F;
    case segment.Reference.UNDEFINED:
      return consts.UNICODE_UNKNOWN_CHAR;
    case segment.Reference.BUFFER:
      if (!this.mappingBuffer_) {
        return consts.UNICODE_UNKNOWN_CHAR;
      }
      return this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()];
    case segment.Reference.INDEXING_BUFFER:
      if (!this.mappingBuffer_) {
        return consts.UNICODE_UNKNOWN_CHAR;
      }
      var offset = this.getIndexingBufferOffset_(seg, chr);
      if (offset === -1) {
        return consts.UNICODE_UNKNOWN_CHAR;
      }
      return this.mappingBuffer_[offset + seg.getOffset()];
    case segment.Reference.SELF:
      return chr;
    case segment.Reference.GB18030_UNICODE_SP_MAPPING:
      return gb18030utils.convertGB18030ToUnicodeSP(chr);
    default:
      return consts.UNICODE_UNKNOWN_CHAR;
  }
};

/**
 * @private
 * @param {segment.Segment} seg
 * @param {number} chr
 * @return {number}
 */
DecoderMultibyte.prototype.getIndexingBufferOffset_ = function(seg, chr) {
  var condition = seg.getCondition();
  if (!condition) {
    return -1;
  }

  return condition.getIndexingOffset(chr);
};

exports.UTF16LE = new DecoderUtf16le();
exports.UTF16BE = new DecoderUtf16be();
exports.UTF8 = new DecoderUtf8();
exports.Decoder = Decoder;
exports.Multibyte = DecoderMultibyte;
