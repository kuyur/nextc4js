/**
 * Reading rule class.
 * @author kuyur@kuyur.info
 */

'use strict';

var goog = require('./goog-base.js').goog;

/**
 * The basic class of encoding-rule.
 * @constructor
 */
var EncodingRule = function() {};

/**
 * Parse a content buffer and return code points in a Uint32Array. Each code
 * point will cost 4 bytes.
 * @param {Uint8Array} buffer content to parse.
 * @return {?Uint32Array} will return null is the content is not matched with
 *   the encoding rule.
 */
EncodingRule.prototype.parse = function(buffer) {
  var length = this.test(buffer);
  if (length === -1) {
    // not matched
    return null;
  }

  var result = new Uint32Array(length);
  var offset;
  for (var i = 0, j = 0, len = buffer.length; i < len; ++j) {
    offset = this.consume(buffer, i, result, j);
    if (offset === 0) {
      return null;
    }
    i += offset;
  }

  return result;
};

/**
 * Parse a content buffer and return code points in an Array. Each code
 * point will cost 8 bytes (Javascript number type).
 * @param {Uint8Array} buffer content to parse.
 * @return {?Array.<number>} will return null is the content is not matched
 *   with the encoding rule.
 */
EncodingRule.prototype.parse2 = function(buffer) {
  var result = [];
  var offset;
  for (var i = 0, j = 0, len = buffer.length; i < len; ++j) {
    offset = this.consume2(buffer, len, i, result, j);
    if (offset === 0) {
      return null;
    }
    i += offset;
  }

  return result;
};

/**
 * Test the content buffer satisfy the EncodingRule and return the length. Will
 * return -1 if buffer content is not satisfied the encoding rule.
 * @param {Uint8Array} buffer
 * @return {number} The count of code points.
 */
EncodingRule.prototype.test = goog.abstractMethod;

/**
 * Consume(parse) a code point from the buffer and save into result array.
 * Won't check the bytes strictly.
 * @constructor
 * @protected
 * @param {Uint8Array} buffer
 * @param {number} i The position (pointer) to read next code point.
 * @param {Uint32Array|Array.<number>} result
 * @param {number} j The position (pointer) to write the code point.
 * @return {number} bytes consumed.
 */
EncodingRule.prototype.consume = goog.abstractMethod;

/**
 * Consume(parse) a code point from the buffer and save into result array.
 * Will check the bytes strictly.
 * @constructor
 * @protected
 * @param {Uint8Array} buffer
 * @param {number} length The length of buffer.
 * @param {number} i The position (pointer) to read next code point.
 * @param {Uint32Array|Array.<number>} result
 * @param {number} j The position (pointer) to write the code point.
 * @return {number} bytes consumed.
 */
EncodingRule.prototype.consume2 = goog.abstractMethod;

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
 * @override
 * @param {Uint8Array} buffer
 * @return {number} The count of code points.
 */
EncodingRuleUTF16LE.prototype.test = function(buffer) {
  if (!buffer) {
    return -1;
  }
  if (buffer.length === 0) {
    return 0;
  }
  if (buffer.length & 0x1 !== 0) {
    return -1;
  }

  var result = 0;
  var chr, low, consumed;
  for (var i = 0, len = buffer.length; i < len;) {
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
 * @param {number} i
 * @param {Uint32Array} result
 * @param {number} j
 * @return {number}
 */
EncodingRuleUTF16LE.prototype.consume = function(buffer, i, result, j) {
  var chr = buffer[i] | (buffer[i + 1] << 8), consumed = 2;
  if (chr >= 0xD800 && chr <= 0xDBFF) { // high byte matched
    var low = buffer[i + 2] | (buffer[i + 3] << 8);
    chr = ((chr & 0x3FF) << 10) + (low & 0x3FF);
    consumed = 4;
  }
  result[j] = chr;
  return consumed;
};

/**
 * The parsed result is a Unicode code point.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} length
 * @param {number} i
 * @param {Uint32Array} result
 * @param {number} j
 * @return {number}
 */
EncodingRuleUTF16LE.prototype.consume2 = function(buffer, length, i, result, j) {
  if (i + 1 >= length) { // invalid
    return 0;
  }
  var chr = buffer[i] | (buffer[i + 1] << 8), consumed = 2;
  if (chr >= 0xD800 && chr <= 0xDBFF) { // high byte matched
    if (i + 3 >= length) { // invalid
      return 0;
    }
    var low = buffer[i + 2] | (buffer[i + 3] << 8);
    if (low < 0xDC00 || low > 0xDFFF) { // invalid
      return 0;
    }
    chr = ((chr & 0x3FF) << 10) + (low & 0x3FF);
    consumed = 4;
  }
  result[j] = chr;
  return consumed;
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
 * @override
 * @param {Uint8Array} buffer
 * @return {number} The count of code points.
 */
EncodingRuleUTF16BE.prototype.test = function(buffer) {
  if (!buffer) {
    return -1;
  }
  if (buffer.length === 0) {
    return 0;
  }
  if (buffer.length & 0x1 !== 0) {
    return -1;
  }

  var result = 0;
  var chr, low, consumed;
  for (var i = 0, len = buffer.length; i < len;) {
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
 * @param {number} i
 * @param {Uint32Array} result
 * @param {number} j
 * @return {number}
 */
EncodingRuleUTF16BE.prototype.consume = function(buffer, i, result, j) {
  var chr = (buffer[i] << 8) | buffer[i + 1] << 8, consumed = 2;
  if (chr >= 0xD800 && chr <= 0xDBFF) { // high byte matched
    var low = (buffer[i + 2] << 8) | buffer[i + 3];
    chr = ((chr & 0x3FF) << 10) + (low & 0x3FF);
    consumed = 4;
  }
  result[j] = chr;
  return consumed;
};

/**
 * The parsed result is a Unicode code point.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} length
 * @param {number} i
 * @param {Uint32Array} result
 * @param {number} j
 * @return {number}
 */
EncodingRuleUTF16BE.prototype.consume2 = function(buffer, length, i, result, j) {
  if (i + 1 >= length) { // invalid
    return 0;
  }
  var chr = (buffer[i] << 8) | buffer[i + 1], consumed = 2;
  if (chr >= 0xD800 && chr <= 0xDBFF) { // high byte matched
    if (i + 3 >= length) { // invalid
      return 0;
    }
    var low = (buffer[i + 2] << 8) | buffer[i + 3];
    if (low < 0xDC00 || low > 0xDFFF) { // invalid
      return 0;
    }
    chr = ((chr & 0x3FF) << 10) + (low & 0x3FF);
    consumed = 4;
  }
  result[j] = chr;
  return consumed;
};

/**
 * UTF-8 encoding rule. The maximum code point for UTF-8 is 0x7FFFFFFF. It is
 * the largest number of 4-bytes signed integer, and it is much larger than the
 * maximum code point of Unicode (0x10FFFF).
 * @see https://en.wikipedia.org/wiki/UTF-8
 * @constructor
 * @extends {EncodingRule}
 */
var EncodingRuleUTF8 = function() {
  EncodingRule.call(this);
};
goog.inherits(EncodingRuleUTF8, EncodingRule);

/**
 * @override
 * @param {Uint8Array} buffer
 * @return {number} The count of code points.
 */
EncodingRuleUTF8.prototype.test = function(buffer) {
  if (!buffer) {
    return -1;
  }
  if (buffer.length === 0) {
    return 0;
  }

  var result = 0;
  for (var i = 0, length = buffer.length; i < length;) {
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
 * Only check leading byte to accelerate the converting. The parsed result
 * will be a Unicode code point.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} i
 * @param {Uint32Array|Array.<number>} result
 * @param {number} j
 * @return {number}
 */
EncodingRuleUTF8.prototype.consume = function(buffer, length, i, result, j) {
  if ((0x80 & buffer[i]) === 0) { // ASCII
    result[j] = buffer[i];
    return 1;
  } else if ((0xE0 & buffer[i]) === 0xC0) { // 110xxxxx 10xxxxxx
    result[j] = (buffer[i] & 0x3F) << 6 | (buffer[i + 1] & 0x3F);
    return 2;
  } else if ((0xF0 & buffer[i]) === 0xE0) { // 1110xxxx 10xxxxxx 10xxxxxx
    result[j] = (buffer[i] & 0x1F) << 12 |
      (buffer[i + 1] & 0x3F) << 6 |
      (buffer[i + 2] & 0x3F);
    return 3;
  } else if ((0xF8 & buffer[i]) === 0xF0) { // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[j] = (buffer[i] & 0x0F) << 18 |
      (buffer[i + 1] & 0x3F) << 12 |
      (buffer[i + 2] & 0x3F) << 6 |
      (buffer[i + 3] & 0x3F);
    return 4;
  } else if ((0xFC & buffer[i]) === 0xF8) { // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[j] = (buffer[i] & 0x07) << 24 |
      (buffer[i + 1] & 0x3F) << 18 |
      (buffer[i + 2] & 0x3F) << 12 |
      (buffer[i + 3] & 0x3F) << 6 |
      (buffer[i + 4] & 0x3F);
    return 5;
  } else if ((0xFE & buffer[i]) === 0xFC) { // 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[j] = (buffer[i] & 0x03) << 30 |
      (buffer[i + 1] & 0x3F) << 24 |
      (buffer[i + 2] & 0x3F) << 18 |
      (buffer[i + 3] & 0x3F) << 12 |
      (buffer[i + 4] & 0x3F) << 6 |
      (buffer[i + 5] & 0x3F);
    return 6;
  }

  return 0;
};

/**
 * The parsed result will be a Unicode code point.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} length
 * @param {number} i
 * @param {Uint32Array|Array.<number>} result
 * @param {number} j
 * @return {number}
 */
EncodingRuleUTF8.prototype.consume2 = function(buffer, length, i, result, j) {
  if ((0x80 & buffer[i]) === 0) { // ASCII
    result[j] = buffer[i];
    return 1;
  } else if (i + 1 < length &&
    (0xE0 & buffer[i]) === 0xC0 &&
    (0xC0 & buffer[i + 1]) === 0x80) { // 110xxxxx 10xxxxxx
    result[j] = (buffer[i] & 0x3F) << 6 | (buffer[i + 1] & 0x3F);
    return 2;
  } else if (i + 2 < length &&
    (0xF0 & buffer[i]) === 0xE0 &&
    (0xC0 & buffer[i + 1]) === 0x80 &&
    (0xC0 & buffer[i + 2]) === 0x80) { // 1110xxxx 10xxxxxx 10xxxxxx
    result[j] = (buffer[i] & 0x1F) << 12 |
      (buffer[i + 1] & 0x3F) << 6 |
      (buffer[i + 2] & 0x3F);
    return 3;
  } else if (i + 3 < length &&
    (0xF8 & buffer[i]) === 0xF0 &&
    (0xC0 & buffer[i + 1]) === 0x80 &&
    (0xC0 & buffer[i + 2]) === 0x80 &&
    (0xC0 & buffer[i + 3]) === 0x80) { // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[j] = (buffer[i] & 0x0F) << 18 |
      (buffer[i + 1] & 0x3F) << 12 |
      (buffer[i + 2] & 0x3F) << 6 |
      (buffer[i + 3] & 0x3F);
    return 4;
  } else if (i + 4 < length &&
    (0xFC & buffer[i]) === 0xF8 &&
    (0xC0 & buffer[i + 1]) === 0x80 &&
    (0xC0 & buffer[i + 2]) === 0x80 &&
    (0xC0 & buffer[i + 3]) === 0x80 &&
    (0xC0 & buffer[i + 4]) === 0x80) { // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[j] = (buffer[i] & 0x07) << 24 |
      (buffer[i + 1] & 0x3F) << 18 |
      (buffer[i + 2] & 0x3F) << 12 |
      (buffer[i + 3] & 0x3F) << 6 |
      (buffer[i + 4] & 0x3F);
    return 5;
  } else if (i + 5 < length &&
    (0xFE & buffer[i]) === 0xFC &&
    (0xC0 & buffer[i + 1]) === 0x80 &&
    (0xC0 & buffer[i + 2]) === 0x80 &&
    (0xC0 & buffer[i + 3]) === 0x80 &&
    (0xC0 & buffer[i + 4]) === 0x80 &&
    (0xC0 & buffer[i + 5]) === 0x80) { // 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
    result[j] = (buffer[i] & 0x03) << 30 |
      (buffer[i + 1] & 0x3F) << 24 |
      (buffer[i + 2] & 0x3F) << 18 |
      (buffer[i + 3] & 0x3F) << 12 |
      (buffer[i + 4] & 0x3F) << 6 |
      (buffer[i + 5] & 0x3F);
    return 6;
  }

  return 0;
};

/**
 * The encoding rule for common Variable-width encoding (MBCS).
 * @see https://en.wikipedia.org/wiki/Variable-width_encoding
 * @param {Array} options
 * @extends {EncodingRule}
 */
var EncodingRuleCommon = function(options) {
  EncodingRule.call(this);
  if (options) {
    options.forEach(function() {
      // TODO
    });
  }
};
goog.inherits(EncodingRuleCommon, EncodingRule);
