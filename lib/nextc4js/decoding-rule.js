/**
 * Reading rule class.
 * @author kuyur@kuyur.info
 */

'use strict';

var condition = require('./condition');
var goog = require('./goog-base');

/**
 * The basic class of decoding-rule.
 * @constructor
 */
var DecodingRule = function() {};

/**
 * Decode a content buffer and return code points in a Uint32Array. Each code
 * point will cost 4 bytes.
 * @param {Uint8Array} buffer content to decode.
 * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
 * @return {?Uint32Array} will return null if the content is not matched with
 *   the decoding rule.
 */
DecodingRule.prototype.decode = function(buffer, opt_offset) {
  var length = this.test(buffer, opt_offset);
  if (length === -1) {
    // not matched
    return null;
  }

  var result = new Uint32Array(length);
  var offset = goog.isNumber(opt_offset) ? opt_offset : 0;
  var bytes;
  for (var pos = 0, len = buffer.length; offset < len; ++pos) {
    bytes = this.consume(buffer, offset, result, pos);
    if (bytes === 0) {
      return null;
    }
    offset += bytes;
  }

  return result;
};

/**
 * Decode a content buffer and return code points in an Array. Each code
 * point will cost 8 bytes (Javascript number type).
 * @param {Uint8Array} buffer content to parse.
 * @param {?number} opt_offset the start position in buffer to parse. 0 by default.
 * @return {?Array.<number>} will return null if the content is not matched
 *   with the decoding rule.
 */
DecodingRule.prototype.parse = function(buffer, opt_offset) {
  var result = [];
  var offset = goog.isNumber(opt_offset) ? opt_offset : 0;
  var bytes;
  for (var pos = 0, len = buffer.length; offset < len; ++pos) {
    bytes = this.consume_s(buffer, offset, result, pos);
    if (bytes === 0) {
      return null;
    }
    offset += bytes;
  }

  return result;
};

/**
 * Test the content buffer satisfy the DecodingRule and return the length. Will
 * return -1 if buffer content is not satisfied the decoding rule.
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the position in buffer to start test. 0 by default.
 * @return {number} The count of code points.
 */
DecodingRule.prototype.test = goog.abstractMethod;

/**
 * Consume(parse) a code point from the buffer and save into result array.
 * Won't check the bytes strictly.
 * @protected
 * @param {Uint8Array} buffer
 * @param {number} offset The position (pointer) to read next code point in
 *   buffer.
 * @param {Uint32Array} result
 * @param {number} pos The position (pointer) to write the code point into
 *   result array.
 * @return {number} bytes consumed.
 */
DecodingRule.prototype.consume = goog.abstractMethod;

/**
 * Consume(parse) a code point from the buffer and save into result array.
 * Will check the bytes strictly. (consume+strictly -> consume_s)
 * @protected
 * @param {Uint8Array} buffer
 * @param {number} offset The position (pointer) to read next code point in
 *   buffer.
 * @param {Array.<number>} result
 * @param {number} pos The position (pointer) to write the code point into
 *   result array.
 * @return {number} bytes consumed.
 */
DecodingRule.prototype.consume_s = goog.abstractMethod;

/**
 * UTF-16 little-endian decoding rule.
 * @constructor
 * @extends {DecodingRule}
 */
var DecodingRuleUTF16LE = function() {
  DecodingRule.call(this);
};
goog.inherits(DecodingRuleUTF16LE, DecodingRule);

/**
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the position in buffer to start test. 0 by default.
 * @return {number} The count of code points.
 */
DecodingRuleUTF16LE.prototype.test = function(buffer, opt_offset) {
  var offset = goog.isNumber(opt_offset) ? opt_offset : 0;
  if (!buffer) {
    return -1;
  }
  if (buffer.length === 0) {
    return 0;
  }
  var remain = buffer.length - offset;
  if (remain <= 0) {
    return 0;
  }
  if (remain & 0x1 !== 0) { // must be an even number
    return -1;
  }

  var result = 0;
  var chr, low, consumed;
  for (var i = offset, len = buffer.length; i < len;) {
    chr = buffer[i] | (buffer[i + 1] << 8);
    consumed = 0;
    if (chr <= 0xD7FF || chr >= 0xE000) {
      result += 1;
      consumed = 2;
    } else {
      if (chr >= 0xD800 && chr <= 0xDBFF && i + 3 < len) { // high byte matched
        low = buffer[i + 2] | (buffer[i + 3] << 8);
        if (low >= 0xDC00 && low <= 0xDFFF) { // low byte matched
          result += 1;
          consumed = 4;
        }
      }
    }
    if (!consumed) {
      return -1;
    }
    i += consumed;
  }

  return result;
};

/**
 * The parsed result is a Unicode code point.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @param {Uint32Array} result
 * @param {number} pos
 * @return {number}
 */
DecodingRuleUTF16LE.prototype.consume = function(buffer, offset, result, pos) {
  var chr = buffer[offset] | (buffer[offset + 1] << 8), consumed = 2;
  if (chr >= 0xD800 && chr <= 0xDBFF) { // high byte matched
    var low = buffer[offset + 2] | (buffer[offset + 3] << 8);
    chr = (((chr & 0x3FF) << 10) | (low & 0x3FF)) + 0x10000;
    consumed = 4;
  }
  result[pos] = chr;
  return consumed;
};

/**
 * The parsed result is a Unicode code point.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @param {Array.<number>} result
 * @param {number} pos
 * @return {number}
 */
DecodingRuleUTF16LE.prototype.consume_s = function(buffer, offset, result, pos) {
  var length = buffer.length;
  if (offset + 1 >= length) { // invalid
    return 0;
  }
  var chr = buffer[offset] | (buffer[offset + 1] << 8), consumed = 2;
  if (chr >= 0xD800 && chr <= 0xDBFF) { // high byte matched
    if (offset + 3 >= length) { // invalid
      return 0;
    }
    var low = buffer[offset + 2] | (buffer[offset + 3] << 8);
    if (low < 0xDC00 || low > 0xDFFF) { // invalid
      return 0;
    }
    chr = (((chr & 0x3FF) << 10) | (low & 0x3FF)) + 0x10000;
    consumed = 4;
  }
  result[pos] = chr;
  return consumed;
};

/**
 * UTF-16 big-endian decoding rule.
 * @constructor
 * @extends {DecodingRule}
 */
var DecodingRuleUTF16BE = function() {
  DecodingRule.call(this);
};
goog.inherits(DecodingRuleUTF16BE, DecodingRule);

/**
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the position in buffer to start test. 0 by default.
 * @return {number} The count of code points.
 */
DecodingRuleUTF16BE.prototype.test = function(buffer, opt_offset) {
  var offset = goog.isNumber(opt_offset) ? opt_offset : 0;
  if (!buffer) {
    return -1;
  }
  if (buffer.length === 0) {
    return 0;
  }
  var remain = buffer.length - offset;
  if (remain <= 0) {
    return 0;
  }
  if (remain & 0x1 !== 0) { // must be an even number
    return -1;
  }

  var result = 0;
  var chr, low, consumed;
  for (var i = offset, len = buffer.length; i < len;) {
    chr = (buffer[i] << 8) | buffer[i + 1];
    consumed = 0;
    if (chr <= 0xD7FF || chr >= 0xE000) {
      result += 1;
      consumed = 2;
    } else {
      if (chr >= 0xD800 && chr <= 0xDBFF && i + 3 < len) { // high byte matched
        low = (buffer[i + 2] << 8) | buffer[i + 3];
        if (low >= 0xDC00 && low <= 0xDFFF) { // low byte matched
          result += 1;
          consumed = 4;
        }
      }
    }
    if (!consumed) {
      return -1;
    }
    i += consumed;
  }

  return result;
};

/**
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @param {Uint32Array} result
 * @param {number} pos
 * @return {number}
 */
DecodingRuleUTF16BE.prototype.consume = function(buffer, offset, result, pos) {
  var chr = (buffer[offset] << 8) | buffer[offset + 1], consumed = 2;
  if (chr >= 0xD800 && chr <= 0xDBFF) { // high byte matched
    var low = (buffer[offset + 2] << 8) | buffer[offset + 3];
    chr = (((chr & 0x3FF) << 10) | (low & 0x3FF)) + 0x10000;
    consumed = 4;
  }
  result[pos] = chr;
  return consumed;
};

/**
 * The parsed result is a Unicode code point.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @param {Array.<number>} result
 * @param {number} pos
 * @return {number}
 */
DecodingRuleUTF16BE.prototype.consume_s = function(buffer, offset, result, pos) {
  var length = buffer.length;
  if (offset + 1 >= length) { // invalid
    return 0;
  }
  var chr = (buffer[offset] << 8) | buffer[offset + 1], consumed = 2;
  if (chr >= 0xD800 && chr <= 0xDBFF) { // high byte matched
    if (offset + 3 >= length) { // invalid
      return 0;
    }
    var low = (buffer[offset + 2] << 8) | buffer[offset + 3];
    if (low < 0xDC00 || low > 0xDFFF) { // invalid
      return 0;
    }
    chr = (((chr & 0x3FF) << 10) | (low & 0x3FF)) + 0x10000;
    consumed = 4;
  }
  result[pos] = chr;
  return consumed;
};

/**
 * UTF-8 decoding rule. The maximum representable code point for UTF-8 is
 * 0x7FFFFFFF. It is the largest number of 4-bytes signed integer, and it is
 * much larger than the maximum code point of Unicode (0x10FFFF).
 * @see https://en.wikipedia.org/wiki/UTF-8
 * @constructor
 * @extends {DecodingRule}
 */
var DecodingRuleUTF8 = function() {
  DecodingRule.call(this);
};
goog.inherits(DecodingRuleUTF8, DecodingRule);

/**
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the position in buffer to start test. 0 by default.
 * @return {number} The count of code points.
 */
DecodingRuleUTF8.prototype.test = function(buffer, opt_offset) {
  var offset = goog.isNumber(opt_offset) ? opt_offset : 0;
  if (!buffer) {
    return -1;
  }
  if (buffer.length === 0 || buffer.length - offset <= 0) {
    return 0;
  }

  var result = 0;
  for (var i = offset, length = buffer.length; i < length;) {
    if ((0x80 & buffer[i]) === 0) { // ASCII
      i++;
      result++;
    } else if (i + 1 < length &&
      (0xE0 & buffer[i]) === 0xC0 &&
      (0xC0 & buffer[i + 1]) === 0x80) { // 110xxxxx 10xxxxxx
      i += 2;
      result++;
    } else if (i + 2 < length &&
      (0xF0 & buffer[i]) === 0xE0 &&
      (0xC0 & buffer[i + 1]) === 0x80 &&
      (0xC0 & buffer[i + 2]) === 0x80) { // 1110xxxx 10xxxxxx 10xxxxxx
      i +=3;
      result++;
    } else if (i + 3 < length &&
      (0xF8 & buffer[i]) === 0xF0 &&
      (0xC0 & buffer[i + 1]) === 0x80 &&
      (0xC0 & buffer[i + 2]) === 0x80 &&
      (0xC0 & buffer[i + 3]) === 0x80) { // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
      i += 4;
      result++;
    } else if (i + 4 < length &&
      (0xFC & buffer[i]) === 0xF8 &&
      (0xC0 & buffer[i + 1]) === 0x80 &&
      (0xC0 & buffer[i + 2]) === 0x80 &&
      (0xC0 & buffer[i + 3]) === 0x80 &&
      (0xC0 & buffer[i + 4]) === 0x80) { // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
      i += 5;
      result++;
    } else if (i + 5 < length &&
      (0xFE & buffer[i]) === 0xFC &&
      (0xC0 & buffer[i + 1]) === 0x80 &&
      (0xC0 & buffer[i + 2]) === 0x80 &&
      (0xC0 & buffer[i + 3]) === 0x80 &&
      (0xC0 & buffer[i + 4]) === 0x80 &&
      (0xC0 & buffer[i + 5]) === 0x80) { // 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
      i += 6;
      result++;
    } else {
      return -1; // not matched
    }
  }

  return result;
};

/**
 * Only check leading byte to accelerate the decoding. The parsed result
 * will be a Unicode code point.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @param {Uint32Array} result
 * @param {number} pos
 * @return {number}
 */
DecodingRuleUTF8.prototype.consume = function(buffer, offset, result, pos) {
  if ((0x80 & buffer[offset]) === 0) { // ASCII
    result[pos] = buffer[offset];
    return 1;
  } else if ((0xE0 & buffer[offset]) === 0xC0) { // 110xxxxx 10xxxxxx
    result[pos] = (buffer[offset] & 0x3F) << 6 | (buffer[offset + 1] & 0x3F);
    return 2;
  } else if ((0xF0 & buffer[offset]) === 0xE0) { // 1110xxxx 10xxxxxx 10xxxxxx
    result[pos] = (buffer[offset] & 0x1F) << 12 |
      (buffer[offset + 1] & 0x3F) << 6 |
      (buffer[offset + 2] & 0x3F);
    return 3;
  } else if ((0xF8 & buffer[offset]) === 0xF0) { // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[pos] = (buffer[offset] & 0x0F) << 18 |
      (buffer[offset + 1] & 0x3F) << 12 |
      (buffer[offset + 2] & 0x3F) << 6 |
      (buffer[offset + 3] & 0x3F);
    return 4;
  } else if ((0xFC & buffer[offset]) === 0xF8) { // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[pos] = (buffer[offset] & 0x07) << 24 |
      (buffer[offset + 1] & 0x3F) << 18 |
      (buffer[offset + 2] & 0x3F) << 12 |
      (buffer[offset + 3] & 0x3F) << 6 |
      (buffer[offset + 4] & 0x3F);
    return 5;
  } else if ((0xFE & buffer[offset]) === 0xFC) { // 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[pos] = (buffer[offset] & 0x03) << 30 |
      (buffer[offset + 1] & 0x3F) << 24 |
      (buffer[offset + 2] & 0x3F) << 18 |
      (buffer[offset + 3] & 0x3F) << 12 |
      (buffer[offset + 4] & 0x3F) << 6 |
      (buffer[offset + 5] & 0x3F);
    return 6;
  }

  return 0;
};

/**
 * The parsed result will be a Unicode code point.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @param {Array.<number>} result
 * @param {number} pos
 * @return {number}
 */
DecodingRuleUTF8.prototype.consume_s = function(buffer, offset, result, pos) {
  var length = buffer.length;
  if ((0x80 & buffer[offset]) === 0) { // ASCII
    result[pos] = buffer[offset];
    return 1;
  } else if (offset + 1 < length &&
    (0xE0 & buffer[offset]) === 0xC0 &&
    (0xC0 & buffer[offset + 1]) === 0x80) { // 110xxxxx 10xxxxxx
    result[pos] = (buffer[offset] & 0x3F) << 6 | (buffer[offset + 1] & 0x3F);
    return 2;
  } else if (offset + 2 < length &&
    (0xF0 & buffer[offset]) === 0xE0 &&
    (0xC0 & buffer[offset + 1]) === 0x80 &&
    (0xC0 & buffer[offset + 2]) === 0x80) { // 1110xxxx 10xxxxxx 10xxxxxx
    result[pos] = (buffer[offset] & 0x1F) << 12 |
      (buffer[offset + 1] & 0x3F) << 6 |
      (buffer[offset + 2] & 0x3F);
    return 3;
  } else if (offset + 3 < length &&
    (0xF8 & buffer[offset]) === 0xF0 &&
    (0xC0 & buffer[offset + 1]) === 0x80 &&
    (0xC0 & buffer[offset + 2]) === 0x80 &&
    (0xC0 & buffer[offset + 3]) === 0x80) { // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[pos] = (buffer[offset] & 0x0F) << 18 |
      (buffer[offset + 1] & 0x3F) << 12 |
      (buffer[offset + 2] & 0x3F) << 6 |
      (buffer[offset + 3] & 0x3F);
    return 4;
  } else if (offset + 4 < length &&
    (0xFC & buffer[offset]) === 0xF8 &&
    (0xC0 & buffer[offset + 1]) === 0x80 &&
    (0xC0 & buffer[offset + 2]) === 0x80 &&
    (0xC0 & buffer[offset + 3]) === 0x80 &&
    (0xC0 & buffer[offset + 4]) === 0x80) { // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[pos] = (buffer[offset] & 0x07) << 24 |
      (buffer[offset + 1] & 0x3F) << 18 |
      (buffer[offset + 2] & 0x3F) << 12 |
      (buffer[offset + 3] & 0x3F) << 6 |
      (buffer[offset + 4] & 0x3F);
    return 5;
  } else if (offset + 5 < length &&
    (0xFE & buffer[offset]) === 0xFC &&
    (0xC0 & buffer[offset + 1]) === 0x80 &&
    (0xC0 & buffer[offset + 2]) === 0x80 &&
    (0xC0 & buffer[offset + 3]) === 0x80 &&
    (0xC0 & buffer[offset + 4]) === 0x80 &&
    (0xC0 & buffer[offset + 5]) === 0x80) { // 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[pos] = (buffer[offset] & 0x03) << 30 |
      (buffer[offset + 1] & 0x3F) << 24 |
      (buffer[offset + 2] & 0x3F) << 18 |
      (buffer[offset + 3] & 0x3F) << 12 |
      (buffer[offset + 4] & 0x3F) << 6 |
      (buffer[offset + 5] & 0x3F);
    return 6;
  }

  return 0;
};

/**
 * The decoding rule for common Variable-width encoding (MBCS, Multi-byte Character Set).
 * @see https://en.wikipedia.org/wiki/Variable-width_encoding
 * @param {Array} options
 * @constructor
 * @extends {DecodingRule}
 */
var DecodingRuleMultibyte = function(options) {
  DecodingRule.call(this);

  this.conditions_ = [];
  if (options && goog.isArray(options)) {
    options.forEach(function(option) {
      var con = condition.Condition.build(option['condition']);
      if (con) {
        this.conditions_.push(con);
      }
    }, this);
  }
};
goog.inherits(DecodingRuleMultibyte, DecodingRule);

/**
 * @private
 * @type {Array.<condition.Condition>}
 */
DecodingRuleMultibyte.prototype.conditions_;

/**
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the position in buffer to start test. 0 by default.
 * @return {number} The count of code points.
 */
DecodingRuleMultibyte.prototype.test = function(buffer, opt_offset) {
  var offset = goog.isNumber(opt_offset) ? opt_offset : 0;
  if (!this.conditions_.length || !buffer) {
    return -1;
  }
  if (buffer.length === 0 || buffer.length - offset <= 0) {
    return 0;
  }

  var result = 0;
  var condition;
  for (var i = offset, length = buffer.length; i < length;) {
    condition = this.find_(buffer, i);
    if (!condition) {
      return -1;
    }
    i += condition.getBytes();
    result++;
  }

  return result;
};

/**
 * Search there is any Condition can consume the next bytes.
 * @private
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @return {condition.Condition}
 */
DecodingRuleMultibyte.prototype.find_ = function(buffer, offset) {
  for (var i = 0, count = this.conditions_.length; i < count; ++i) {
    if (this.conditions_[i].consume(buffer, offset)) {
      return this.conditions_[i];
    }
  }
  return null;
};

/**
 * The parsed result is a MBCS code point.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @param {Uint32Array} result
 * @param {number} pos
 * @return {number}
 */
DecodingRuleMultibyte.prototype.consume = function (buffer, offset, result, pos) {
  var condition = this.find_(buffer, offset);
  if (!condition) {
    return 0;
  }
  var bytes = condition.getBytes();
  result[pos] = this.readUInt32BE_(buffer, offset, bytes);
  return bytes;
};

/**
 * It is safe to accelerate the decoding without checking buffer boundary.
 * @private
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @param {number} bytes
 * @return {number}
 */
DecodingRuleMultibyte.prototype.readUInt32BE_ = function(buffer, offset, bytes) {
  var result = 0;
  for (var i = 0; i < bytes; ++i) {
    result |= buffer[offset + i] << (8 * (bytes - 1 - i));
  }
  return result >>> 0;
};

/**
 * The parsed result is a MBCS code point.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @param {Array.<number>} result
 * @param {number} pos
 * @return {number}
 */
DecodingRuleMultibyte.prototype.consume_s = DecodingRuleMultibyte.prototype.consume;

exports.Multibyte = DecodingRuleMultibyte;
exports.UTF16LE = new DecodingRuleUTF16LE();
exports.UTF16BE = new DecodingRuleUTF16BE();
exports.UTF8 = new DecodingRuleUTF8();
