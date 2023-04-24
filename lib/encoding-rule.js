/**
 * Reading rule class.
 * @author kuyur@kuyur.net
 */

'use strict';

const goog = require('./goog-base');
const segment = require('./segment');
const gb18030utils = require('./gb18030');
const bufferutils = require('./buffer-utils');

/**
 * The basic class of encoding-rule.
 * @constructor
 */
var EncodingRule = function() {};

/**
 * Encode the Unicode code points.
 * @param {Uint32Array|Array.<number>} buffer Every element must be a Unicode
 *   code points.
 * @return {Uint8Array}
 */
EncodingRule.prototype.encode = function(buffer) {
  var length = this.test(buffer);
  if (length === -1){
    return null;
  }

  var result = new Uint8Array(length);
  var offset = 0;
  for (var i = 0, len = buffer.length; i < len; ++i) {
    offset += this.consume(buffer, i, result, offset);
  }

  return result;
};

/**
 * Encode the JavaScript string.
 * @param {string} str
 * @param {?boolean} opt_returnArray if true, will return array instead of Uint8Array. Default is false.
 * @return {Uint8Array|Array}
 */
EncodingRule.prototype.unparse = function(str, opt_returnArray) {
  var length = this.tell(str);
  if (length === -1){
    return null;
  }

  var result = opt_returnArray ? [] : new Uint8Array(length);
  var offset = 0;
  for (var i = 0, len = str.length; i < len; ++i) {
    var chr = str.codePointAt(i);
    offset += this.write(chr, result, offset);
    if (chr > 65535) { // skip the next code unit
      i++;
    }
  }

  return result;
};

/**
 * Test the buffer and return length of encoded bytes.
 * @param {Uint32Array|Array.<number>} buffer
 * @return {number} The length of encoded bytes.
 */
EncodingRule.prototype.test = goog.abstractMethod;

/**
 * Consume a Unicode code point from source buffer and save the encoded binary
 * into result buffer. Won't check the bytes strictly.
 * @protected
 * @param {Uint32Array|Array.<number>} buffer The source buffer holding UTF-16
 *   code points.
 * @param {number} pos The position (pointer) to read next Unicode code point.
 * @param {Uint8Array} result
 * @param {number} offset The position (pointer) to write the encoded binary
 *   into result array.
 * @return {number} bytes encoded.
 */
EncodingRule.prototype.consume = goog.abstractMethod;

/**
 * Return length of encoded bytes.
 * @param {string} str
 * @return {number} The length of encoded bytes.
 */
EncodingRule.prototype.tell = goog.abstractMethod;

/**
 * Encode the char and write into result buffer.
 * @param {number} chr Code point of the char.
 * @param {Uint8Array|Array} result
 *   into result array.
 * @param {number} offset The position (pointer) to write the encoded binary
 *   into result array.
 * @return {number} The length of encoded bytes.
 */
EncodingRule.prototype.write = goog.abstractMethod;

/**
 * UTF-16 little-endian encoding rule.
 * @constructor
 * @extends {EncodingRule}
 */
var EncodingRuleUTF16LE = function() {
  EncodingRule.call(this);
};
goog.inherits(EncodingRuleUTF16LE, EncodingRule);

/**
 * The invalid Unicode code point will be skipped.
 * @override
 * @param {Uint32Array|Array.<number>} buffer
 * @return {number} The length of encoded bytes.
 */
EncodingRuleUTF16LE.prototype.test = function(buffer) {
  if (!goog.isArrayLike(buffer)) {
    return -1;
  }
  if (buffer.length === 0) {
    return 0;
  }

  var result = 0, chr;
  for (var i = 0, len = buffer.length; i < len; ++i) {
    chr = buffer[i] >>> 0;
    if (chr <= 0xD7FF) {
      result += 2;
    } else if (chr >= 0xD800 && chr <= 0xDFFF) {
      // not a valid Unicode code point
    } else if (chr >= 0xE000 && chr <= 0xFFFF) {
      result += 2;
    } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
      result += 4;
    } else {
      // not a valid Unicode code point
    }
  }
  return result;
};

/**
 * The invalid Unicode code point will be skipped.
 * @override
 * @param {Uint32Array|Array.<number>} buffer
 * @param {number} pos
 * @param {Uint8Array} result
 * @param {number} offset
 * @return {number}
 */
EncodingRuleUTF16LE.prototype.consume = function(buffer, pos, result, offset) {
  var bytes;
  var chr = buffer[pos] >>> 0;
  if (chr <= 0xD7FF || (chr >= 0xE000 && chr <= 0xFFFF)) {
    result[offset] = chr & 0xFF;
    result[offset + 1] = chr >> 8;
    bytes = 2;
  } else if (chr >= 0xD800 && chr <= 0xDFFF) {
    // not a valid Unicode code point
    bytes = 0;
  } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
    chr -= 0x10000;
    var low = (chr & 0x3FF) + 0xDC00;
    var high = (chr >> 10) + 0xD800;
    result[offset] = high & 0xFF;
    result[offset + 1] = high >> 8;
    result[offset + 2] = low & 0xFF;
    result[offset + 3] = low >> 8;
    bytes = 4;
  } else {
    // not a valid Unicode code point
    bytes = 0;
  }

  return bytes;
};

/**
 * @override
 * @param {string} str
 * @return {number}
 */
EncodingRuleUTF16LE.prototype.tell = function(str) {
  return goog.isString(str) ? str.length * 2 : -1;
};

/**
 * @override
 * @param {number} chr
 * @param {Uint8Array|Array} result
 * @param {number} offset
 * @return {number}
 */
EncodingRuleUTF16LE.prototype.write = function(chr, result, offset) {
  var bytes;
  if (chr <= 0xD7FF || (chr >= 0xE000 && chr <= 0xFFFF)) {
    result[offset] = chr & 0xFF;
    result[offset + 1] = chr >> 8;
    bytes = 2;
  } else if (chr >= 0xD800 && chr <= 0xDFFF) {
    // not a valid Unicode code point
    bytes = 0;
  } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
    chr -= 0x10000;
    var low = (chr & 0x3FF) + 0xDC00;
    var high = (chr >> 10) + 0xD800;
    result[offset] = high & 0xFF;
    result[offset + 1] = high >> 8;
    result[offset + 2] = low & 0xFF;
    result[offset + 3] = low >> 8;
    bytes = 4;
  } else {
    // not a valid Unicode code point
    bytes = 0;
  }

  return bytes;
};

/**
 * UTF-16 big-endian encoding rule.
 * @constructor
 * @extends {EncodingRule}
 */
var EncodingRuleUTF16BE = function() {
  EncodingRule.call(this);
};
goog.inherits(EncodingRuleUTF16BE, EncodingRule);

/**
 * The invalid Unicode code point will be ignored.
 * @override
 * @param {Uint32Array|Array.<number>} buffer
 * @return {number} The length of encoded bytes.
 */
EncodingRuleUTF16BE.prototype.test = function(buffer) {
  if (!goog.isArrayLike(buffer)) {
    return -1;
  }
  if (buffer.length === 0) {
    return 0;
  }

  var result = 0, chr;
  for (var i = 0, len = buffer.length; i < len; ++i) {
    chr = buffer[i] >>> 0;
    if (chr <= 0xD7FF) {
      result += 2;
    } else if (chr >= 0xD800 && chr <= 0xDFFF) {
      // not a valid Unicode code point
    } else if (chr >= 0xE000 && chr <= 0xFFFF) {
      result += 2;
    } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
      result += 4;
    } else {
      // not a valid Unicode code point
    }
  }
  return result;
};

/**
 * The invalid Unicode code point will be skipped.
 * @override
 * @param {Uint32Array|Array.<number>} buffer
 * @param {number} pos
 * @param {Uint8Array} result
 * @param {number} offset
 * @return {number}
 */
EncodingRuleUTF16BE.prototype.consume = function(buffer, pos, result, offset) {
  var bytes;
  var chr = buffer[pos] >>> 0;
  if (chr <= 0xD7FF || (chr >= 0xE000 && chr <= 0xFFFF)) {
    result[offset] = chr >> 8;
    result[offset + 1] = chr & 0xFF;
    bytes = 2;
  } else if (chr >= 0xD800 && chr <= 0xDFFF) {
    // not a valid Unicode code point
    bytes = 0;
  } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
    chr -= 0x10000;
    var low = (chr & 0x3FF) + 0xDC00;
    var high = (chr >> 10) + 0xD800;
    result[offset] = high >> 8;
    result[offset + 1] = high & 0xFF;
    result[offset + 2] = low >> 8;
    result[offset + 3] = low & 0xFF;
    bytes = 4;
  } else {
    // not a valid Unicode code point
    bytes = 0;
  }

  return bytes;
};

/**
 * @override
 * @param {string} str
 * @return {number}
 */
EncodingRuleUTF16BE.prototype.tell = function(str) {
  return goog.isString(str) ? str.length * 2 : -1;
};

/**
 * @override
 * @param {number} chr
 * @param {Uint8Array|Array} result
 * @param {number} offset
 * @return {number}
 */
EncodingRuleUTF16BE.prototype.write = function(chr, result, offset) {
  var bytes;
  if (chr <= 0xD7FF || (chr >= 0xE000 && chr <= 0xFFFF)) {
    result[offset] = chr >> 8;
    result[offset + 1] = chr & 0xFF;
    bytes = 2;
  } else if (chr >= 0xD800 && chr <= 0xDFFF) {
    // not a valid Unicode code point
    bytes = 0;
  } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
    chr -= 0x10000;
    var low = (chr & 0x3FF) + 0xDC00;
    var high = (chr >> 10) + 0xD800;
    result[offset] = high >> 8;
    result[offset + 1] = high & 0xFF;
    result[offset + 2] = low >> 8;
    result[offset + 3] = low & 0xFF;
    bytes = 4;
  } else {
    // not a valid Unicode code point
    bytes = 0;
  }

  return bytes;
};

/**
 * UTF-8 encoding rule.
 * @constructor
 * @extends {EncodingRule}
 */
var EncodingRuleUTF8 = function() {
  EncodingRule.call(this);
};
goog.inherits(EncodingRuleUTF8, EncodingRule);

/**
 * The invalid Unicode code point will be ignored.
 * @override
 * @param {Uint32Array|Array.<number>} buffer
 * @return {number} The length of bytes with UTF-8 encoding.
 */
EncodingRuleUTF8.prototype.test = function(buffer) {
  if (!goog.isArrayLike(buffer)) {
    return -1;
  }
  if (buffer.length === 0) {
    return 0;
  }

  var result = 0, chr;
  for (var i = 0, len = buffer.length; i < len; ++i) {
    chr = buffer[i] >>> 0;
    if (chr <= 0x7F) { // U+0000 ~ U+007F
      result += 1;
    } else if (chr <= 0x7FF) { // U+0080 ~ U+07FF
      result += 2;
    } else if (chr <= 0xD7FF) { // U+0800 ~ U+D7FF
      result += 3;
    } else if (chr <= 0xDFFF) { // U+D800 ~ U+DFFF
      // not a valid Unicode code point
    } else if (chr <= 0xFFFF) { // U+E000 ~ U+FFFF
      result += 3;
    } else if (chr <= 0x10FFFF) { // U+10000 ~- U+10FFFF
      result += 4;
    } else {
      // not a valid Unicode code point
    }
  }
  return result;
};

/**
 * The invalid Unicode code point will be skipped.
 * @override
 * @param {Uint32Array|Array.<number>} buffer
 * @param {number} pos
 * @param {Uint8Array} result
 * @param {number} offset
 * @return {number}
 */
EncodingRuleUTF8.prototype.consume = function(buffer, pos, result, offset) {
  var bytes;
  var chr = buffer[pos] >>> 0;
  if (chr <= 0x7F) { // U+0000 ~ U+007F
    result[offset] = chr;
    bytes = 1;
  } else if (chr <= 0x7FF) { // U+0080 ~ U+07FF
    result[offset] = 0xC0 | (chr >> 6);
    result[offset + 1] = 0x80 | (chr & 0x3F);
    bytes = 2;
  } else if (chr >= 0xD800 && chr <= 0xDFFF) { // U+D800 ~ U+DFFF
    // not a valid Unicode code point
    bytes = 0;
  } else if (chr <= 0xFFFF) { // U+0800 ~ U+D7FF, U+E000 ~ U+FFFF
    result[offset] = 0xE0 | (chr >> 12);
    result[offset + 1] = 0x80 | ((chr >> 6) & 0x3F);
    result[offset + 2] = 0x80 | (chr & 0x3F);
    bytes = 3;
  } else if (chr <= 0x10FFFF) { // U+10000 ~- U+10FFFF
    result[offset] = 0xF0 | (chr >> 18);
    result[offset + 1] = 0x80 | ((chr >> 12) & 0x3F);
    result[offset + 2] = 0x80 | ((chr >> 6) & 0x3F);
    result[offset + 3] = 0x80 | (chr & 0x3F);
    bytes = 4;
  } else {
    // not a valid Unicode code point
    bytes = 0;
  }

  return bytes;
};

/**
 * @override
 * @param {string} str
 * @return {number}
 */
EncodingRuleUTF8.prototype.tell = function(str) {
  if (!goog.isString(str)) {
    return -1;
  }

  var result = 0, chr;
  for (var i = 0, len = str.length; i < len; ++i) {
    chr = str.codePointAt(i);
    if (chr <= 0x7F) { // U+0000 ~ U+007F
      result += 1;
    } else if (chr <= 0x7FF) { // U+0080 ~ U+07FF
      result += 2;
    } else if (chr <= 0xD7FF) { // U+0800 ~ U+D7FF
      result += 3;
    } else if (chr <= 0xDFFF) { // U+D800 ~ U+DFFF
      // not a valid Unicode code point
    } else if (chr <= 0xFFFF) { // U+E000 ~ U+FFFF
      result += 3;
    } else if (chr <= 0x10FFFF) { // U+10000 ~- U+10FFFF
      result += 4;
    } else {
      // not a valid Unicode code point
    }
    if (chr > 65535) {
      i++;
    }
  }
  return result;
};

/**
 * @override
 * @param {number} chr
 * @param {Uint8Array|Array} result
 * @param {number} offset
 * @return {number}
 */
EncodingRuleUTF8.prototype.write = function(chr, result, offset) {
  var bytes;
  if (chr <= 0x7F) { // U+0000 ~ U+007F
    result[offset] = chr;
    bytes = 1;
  } else if (chr <= 0x7FF) { // U+0080 ~ U+07FF
    result[offset] = 0xC0 | (chr >> 6);
    result[offset + 1] = 0x80 | (chr & 0x3F);
    bytes = 2;
  } else if (chr >= 0xD800 && chr <= 0xDFFF) { // U+D800 ~ U+DFFF
    // not a valid Unicode code point
    bytes = 0;
  } else if (chr <= 0xFFFF) { // U+0800 ~ U+D7FF, U+E000 ~ U+FFFF
    result[offset] = 0xE0 | (chr >> 12);
    result[offset + 1] = 0x80 | ((chr >> 6) & 0x3F);
    result[offset + 2] = 0x80 | (chr & 0x3F);
    bytes = 3;
  } else if (chr <= 0x10FFFF) { // U+10000 ~- U+10FFFF
    result[offset] = 0xF0 | (chr >> 18);
    result[offset + 1] = 0x80 | ((chr >> 12) & 0x3F);
    result[offset + 2] = 0x80 | ((chr >> 6) & 0x3F);
    result[offset + 3] = 0x80 | (chr & 0x3F);
    bytes = 4;
  } else {
    // not a valid Unicode code point
    bytes = 0;
  }

  return bytes;
};

/**
 * The encoding rule for common Variable-width encoding (MBCS, Multiple-byte Character Set).
 * @constructor
 * @param {Array.<Object>} segments
 * @param {Uint16Array|Uint32Array|string} mappingBuffer
 * @param {number} unknownChar
 * @extends {EncodingRule}
 */
var EncodingRuleMultibyte = function(segments, mappingBuffer, unknownChar) {
  EncodingRule.call(this);

  this.segments_ = new segment.Segments(segments);
  this.mappingBuffer_ = mappingBuffer;
  this.unknownChar_ = unknownChar || 0x3F;
  this.unknownCharBytes_ = this.getCharBytes_(this.unknownChar_);
};
goog.inherits(EncodingRuleMultibyte, EncodingRule);

/**
 * @private
 * @type {segment.Segments}
 */
EncodingRuleMultibyte.prototype.segments_;

/**
 * The mapping buffer to encoding Unicode code point (BMP) into MBCS code point.
 * The mapping buffer is storing MBCS code point in Unicode order.
 * @private
 * @type {Uint16Array|Uint32Array}
 */
EncodingRuleMultibyte.prototype.mappingBuffer_;

/**
 * @private
 * @type {number}
 */
EncodingRuleMultibyte.prototype.unknownChar_;

/**
 * Get bytes of one code point inside mapping buffer.
 * @return {number}
 */
EncodingRuleMultibyte.prototype.getBytesOfCodepoint = function() {
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
 * The invalid Unicode code point will be ignored.
 * @override
 * @param {Uint32Array|Array.<number>} buffer
 * @return {number} The length of bytes with MBCS encoding.
 */
EncodingRuleMultibyte.prototype.test = function(buffer) {
  if (!goog.isArrayLike(buffer)) {
    return -1;
  }
  var len = buffer.length;
  if (len === 0) {
    return 0;
  }

  var result = 0, chr, seg;
  for (var i = 0; i < len; ++i) {
    chr = buffer[i] >>> 0;
    seg = this.segments_.find(chr);
    if (!seg) {
      result += this.unknownCharBytes_;
      continue;
    }
    switch (seg.getReference()) {
      case segment.Reference.ASCII:
        result += 1;
        break;
      case segment.Reference.BUFFER:
        if (!this.mappingBuffer_) {
          result += this.unknownCharBytes_;
        } else {
          result += this.getCharBytes_(this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()]);
        }
        break;
      case segment.Reference.GB18030_UNICODE_SP_MAPPING:
        result += 4;
        break;
      default:
        break;
    }
  }
  return result;
};

/**
 * @param {number} chr
 * @return {number}
 */
EncodingRuleMultibyte.prototype.getCharBytes_ = function(chr) {
  chr = chr >>> 0;
  return chr <= 0xFF ? 1 : chr <= 0xFFFF ? 2 : 4;
};

/**
 * @override
 * @param {Uint32Array|Array.<number>} buffer
 * @param {number} pos
 * @param {Uint8Array} result
 * @param {number} offset
 * @return {number}
 */
EncodingRuleMultibyte.prototype.consume = function(buffer, pos, result, offset) {
  var bytes = 0;
  var chr = buffer[pos] >>> 0, converted;
  var seg = this.segments_.find(chr);
  if (!seg) {
    bufferutils.writeUInt32BE(result, offset, this.unknownChar_, this.unknownCharBytes_);
    return this.unknownCharBytes_;
  }
  switch (seg.getReference()) {
    case segment.Reference.ASCII:
      result[offset] = chr;
      bytes = 1;
      break;
    case segment.Reference.BUFFER:
      if (!this.mappingBuffer_) {
        bufferutils.writeUInt32BE(result, offset, this.unknownChar_, this.unknownCharBytes_);
        return this.unknownCharBytes_;
      }
      converted = this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()];
      bytes = this.getCharBytes_(converted);
      bufferutils.writeUInt32BE(result, offset, converted, bytes);
      break;
    case segment.Reference.GB18030_UNICODE_SP_MAPPING:
      converted = gb18030utils.convertUnicodeSPToGB18030(chr);
      bytes = 4;
      bufferutils.writeUInt32BE(result, offset, converted, bytes);
      break;
    default:
      break;
  }
  return bytes;
};

/**
 * @override
 * @param {string} str
 * @return {number}
 */
EncodingRuleMultibyte.prototype.tell = function(str) {
  if (!goog.isString(str)) {
    return -1;
  }

  var result = 0, chr, seg;
  for (var i = 0, len = str.length; i < len; ++i) {
    chr = str.codePointAt(i);
    if (chr > 65535) {
      i++;
    }
    seg = this.segments_.find(chr);
    if (!seg) {
      result += this.unknownCharBytes_;
      continue;
    }
    switch (seg.getReference()) {
      case segment.Reference.ASCII:
        result += 1;
        break;
      case segment.Reference.BUFFER:
        if (!this.mappingBuffer_) {
          result += this.unknownCharBytes_;
        } else {
          result += this.getCharBytes_(this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()]);
        }
        break;
      case segment.Reference.GB18030_UNICODE_SP_MAPPING:
        result += 4;
        break;
      default:
        break;
    }
  }
  return result;
};

/**
 * @override
 * @param {number} chr
 * @param {Uint8Array} result
 * @param {number} offset
 * @return {number}
 */
EncodingRuleMultibyte.prototype.write = function(chr, result, offset) {
  var bytes = 0;
  var converted;
  var seg = this.segments_.find(chr);
  if (!seg) {
    bufferutils.writeUInt32BE(result, offset, this.unknownChar_, this.unknownCharBytes_);
    return this.unknownCharBytes_;
  }
  switch (seg.getReference()) {
    case segment.Reference.ASCII:
      result[offset] = chr;
      bytes = 1;
      break;
    case segment.Reference.BUFFER:
      if (!this.mappingBuffer_) {
        bufferutils.writeUInt32BE(result, offset, this.unknownChar_, this.unknownCharBytes_);
        return this.unknownCharBytes_;
      }
      converted = this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()];
      bytes = this.getCharBytes_(converted);
      bufferutils.writeUInt32BE(result, offset, converted, bytes);
      break;
    case segment.Reference.GB18030_UNICODE_SP_MAPPING:
      converted = gb18030utils.convertUnicodeSPToGB18030(chr);
      bytes = 4;
      bufferutils.writeUInt32BE(result, offset, converted, bytes);
      break;
    default:
      break;
  }
  return bytes;
};

exports.UTF16LE = new EncodingRuleUTF16LE();
exports.UTF16BE = new EncodingRuleUTF16BE();
exports.UTF8 = new EncodingRuleUTF8();
exports.Multibyte = EncodingRuleMultibyte;
