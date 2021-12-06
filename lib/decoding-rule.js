/**
 * Reading rule class.
 * @author kuyur@kuyur.info
 */

'use strict';

const { Condition } = require('./condition');
const goog = require('./goog-base');
const consts = require('./consts');
const segment = require('./segment');
const gb18030utils = require('./gb18030');

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
 * Decode a content buffer and return native JavaScript string.
 * @param {Uint8Array} buffer content to parse.
 * @param {?number} opt_offset the start position in buffer to parse. 0 by default.
 * @return {string>} will return an empty string if the content is not matched
 *   with the decoding rule.
 */
DecodingRule.prototype.parse = function(buffer, opt_offset) {
  var result = [],
    pos = 0;
  var offset = goog.isNumber(opt_offset) ? opt_offset : 0;
  var mapped;
  for (var len = buffer.length; offset < len;) {
    mapped = this.read(buffer, offset);
    if (!mapped) {
      return '';
    }
    result[pos++] = mapped.decoded;
    offset += mapped.consumed;
  }

  return result.join('');
};

/**
 * Test the content buffer satisfy the DecodingRule or not.
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the position in buffer to start test. 0 by default.
 * @return {boolean}
 */
DecodingRule.prototype.match = function(buffer, opt_offset) {
  return this.test(buffer, opt_offset) !== -1;
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
 * Read a code point from the buffer and return the decoded result.
 * Will check the bytes strictly. If the bytes are not matched with the decoding
 * rule, should return null.
 * @protected
 * @param {Uint8Array} buffer
 * @param {number} offset The position (pointer) to read next code point in
 *   buffer.
 * @return {?{
 *   consumed: number,
 *   decoded: string
 * }}
 */
DecodingRule.prototype.read = goog.abstractMethod;

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
 * Read a code point from the buffer and return the decoded result.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @return {?{
 *   consumed: number,
 *   decoded: string
 * }}
 */
DecodingRuleUTF16LE.prototype.read = function(buffer, offset) {
  var length = buffer.length;
  if (offset + 1 >= length) { // invalid
    return null;
  }
  var high = buffer[offset] | (buffer[offset + 1] << 8),
    low,
    consumed = 2;
  if (high >= 0xD800 && high <= 0xDBFF) { // high byte matched
    if (offset + 3 >= length) { // invalid
      return null;
    }
    low = buffer[offset + 2] | (buffer[offset + 3] << 8);
    if (low < 0xDC00 || low > 0xDFFF) { // invalid
      return null;
    }
    consumed = 4;
  }
  // another method to get the character from code point:
  //   var chr = (((high & 0x3FF) << 10) | (low & 0x3FF)) + 0x10000;
  //   String.fromCodePoint(chr);
  return {
    consumed: consumed,
    decoded: consumed === 2 ? String.fromCharCode(high) : String.fromCharCode(high) + String.fromCharCode(low)
  };
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
 * Read a code point from the buffer and return the decoded result.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @return {?{
 *   consumed: number,
 *   decoded: string
 * }}
 */
DecodingRuleUTF16BE.prototype.read = function(buffer, offset) {
  var length = buffer.length;
  if (offset + 1 >= length) { // invalid
    return null;
  }
  var high = (buffer[offset] << 8) | buffer[offset + 1],
    low,
    consumed = 2;
  if (high >= 0xD800 && high <= 0xDBFF) { // high byte matched
    if (offset + 3 >= length) { // invalid
      return null;
    }
    low = (buffer[offset + 2] << 8) | buffer[offset + 3];
    if (low < 0xDC00 || low > 0xDFFF) { // invalid
      return null;
    }
    consumed = 4;
  }
  // another method to get the character from code point:
  //   var chr = (((high & 0x3FF) << 10) | (low & 0x3FF)) + 0x10000;
  //   String.fromCodePoint(chr);
  return {
    consumed: consumed,
    decoded: consumed === 2 ? String.fromCharCode(high) : String.fromCharCode(high) + String.fromCharCode(low)
  };
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
 * Read a code point from the buffer and return the decoded result.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @return {?{
 *   consumed: number,
 *   decoded: string
 * }}
 */
DecodingRuleUTF8.prototype.read = function(buffer, offset) {
  var length = buffer.length,
    codepoint;
  if ((0x80 & buffer[offset]) === 0) { // ASCII
    codepoint = buffer[offset];
    return {
      consumed: 1,
      decoded: String.fromCharCode(codepoint)
    };
  } else if (offset + 1 < length &&
    (0xE0 & buffer[offset]) === 0xC0 &&
    (0xC0 & buffer[offset + 1]) === 0x80) { // 110xxxxx 10xxxxxx
    codepoint = (buffer[offset] & 0x3F) << 6 | (buffer[offset + 1] & 0x3F);
    return {
      consumed: 2,
      decoded: String.fromCharCode(codepoint)
    };
  } else if (offset + 2 < length &&
    (0xF0 & buffer[offset]) === 0xE0 &&
    (0xC0 & buffer[offset + 1]) === 0x80 &&
    (0xC0 & buffer[offset + 2]) === 0x80) { // 1110xxxx 10xxxxxx 10xxxxxx
    codepoint = (buffer[offset] & 0x1F) << 12 |
      (buffer[offset + 1] & 0x3F) << 6 |
      (buffer[offset + 2] & 0x3F);
    return {
      consumed: 3,
      decoded: String.fromCharCode(codepoint)
    };
  } else if (offset + 3 < length &&
    (0xF8 & buffer[offset]) === 0xF0 &&
    (0xC0 & buffer[offset + 1]) === 0x80 &&
    (0xC0 & buffer[offset + 2]) === 0x80 &&
    (0xC0 & buffer[offset + 3]) === 0x80) { // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    codepoint = (buffer[offset] & 0x0F) << 18 |
      (buffer[offset + 1] & 0x3F) << 12 |
      (buffer[offset + 2] & 0x3F) << 6 |
      (buffer[offset + 3] & 0x3F);
    return {
      consumed: 4,
      decoded: String.fromCodePoint(codepoint)
    };
  } else if (offset + 4 < length &&
    (0xFC & buffer[offset]) === 0xF8 &&
    (0xC0 & buffer[offset + 1]) === 0x80 &&
    (0xC0 & buffer[offset + 2]) === 0x80 &&
    (0xC0 & buffer[offset + 3]) === 0x80 &&
    (0xC0 & buffer[offset + 4]) === 0x80) { // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
    codepoint = (buffer[offset] & 0x07) << 24 |
      (buffer[offset + 1] & 0x3F) << 18 |
      (buffer[offset + 2] & 0x3F) << 12 |
      (buffer[offset + 3] & 0x3F) << 6 |
      (buffer[offset + 4] & 0x3F);
    return {
      consumed: 5,
      decoded: String.fromCodePoint(codepoint)
    };
  } else if (offset + 5 < length &&
    (0xFE & buffer[offset]) === 0xFC &&
    (0xC0 & buffer[offset + 1]) === 0x80 &&
    (0xC0 & buffer[offset + 2]) === 0x80 &&
    (0xC0 & buffer[offset + 3]) === 0x80 &&
    (0xC0 & buffer[offset + 4]) === 0x80 &&
    (0xC0 & buffer[offset + 5]) === 0x80) { // 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
    codepoint = (buffer[offset] & 0x03) << 30 |
      (buffer[offset + 1] & 0x3F) << 24 |
      (buffer[offset + 2] & 0x3F) << 18 |
      (buffer[offset + 3] & 0x3F) << 12 |
      (buffer[offset + 4] & 0x3F) << 6 |
      (buffer[offset + 5] & 0x3F);
    return {
      consumed: 6,
      decoded: String.fromCodePoint(codepoint)
    };
  }

  return 0;
};

/**
 * The decoding rule for common Variable-width encoding (MBCS, Multi-byte Character Set).
 * @see https://en.wikipedia.org/wiki/Variable-width_encoding
 * @param {Array.<{condition: string[]}>} rules
 * @param {Array.<{
 *   begin: number,
 *   end: number,
 *   reference: string,
 *   condition: ?string[],
 *   offset: ?number,
 *   characterset: ?string
 * }>} segments
 * @param {Uint16Array|Uint32Array} mappingBuffer
 * @constructor
 * @extends {DecodingRule}
 */
var DecodingRuleMultibyte = function(rules, segments, mappingBuffer) {
  DecodingRule.call(this);

  this.conditions_ = [];
  if (rules && goog.isArray(rules)) {
    rules.forEach(function(rule) {
      var con = Condition.build(rule.condition);
      if (con) {
        this.conditions_.push(con);
      }
    }, this);
  }

  this.segments_ = new segment.Segments(segments);
  this.mappingBuffer_ = mappingBuffer;
};
goog.inherits(DecodingRuleMultibyte, DecodingRule);

/**
 * @private
 * @type {Array.<Condition>}
 */
DecodingRuleMultibyte.prototype.conditions_;

/**
 * The mapping buffer to convert MBCS code point to Unicode code point.
 * The mapping buffer is storing Unicode code points in MBCS order.
 * @private
 * @type {Uint16Array|Uint32Array}
 */
DecodingRuleMultibyte.prototype.mappingBuffer_;

/**
 * @private
 * @type {segment.Segments}
*/
DecodingRuleMultibyte.prototype.segments_;

/**
 * Get bytes of one code point inside mapping buffer.
 * @return {number}
 */
DecodingRuleMultibyte.prototype.getBytesOfCodepoint = function() {
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
 * Only check the code point sequence matched with conditions or not.
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
 * Check the code point sequence strictly. If any code point is mapped to unknown
 * char (0xFFFD), will return false.
 * @override
 * @param {Uint8Array} buffer
 * @param {?number} opt_offset the position in buffer to start test. 0 by default.
 * @return {boolean}
 */
DecodingRuleMultibyte.prototype.match = function(buffer, opt_offset) {
  var offset = goog.isNumber(opt_offset) ? opt_offset : 0;
  if (!this.conditions_.length || !buffer) {
    return false;
  }
  if (buffer.length === 0 || buffer.length - offset <= 0) {
    return true;
  }

  var condition;
  for (var i = offset, length = buffer.length; i < length;) {
    condition = this.find_(buffer, i);
    if (!condition) {
      return false;
    }
    var origin = this.readUInt32BE_(buffer, i, condition.getBytes());
    if (this.convertChar_(origin) === consts.UNICODE_UNKNOWN_CHAR) {
      return false;
    }
    i += condition.getBytes();
  }

  return true;
};

/**
 * Search there is any Condition can consume the next bytes.
 * @private
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @return {Condition}
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
 * The parsed result is a Unicode code point.
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
  var origin = this.readUInt32BE_(buffer, offset, bytes);
  result[pos] = this.convertChar_(origin);
  return bytes;
};

/**
 * Read a code point from the buffer and return the decoded result.
 * @override
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @return {?{
 *   consumed: number,
 *   decoded: string
 * }}
 */
DecodingRuleMultibyte.prototype.read = function(buffer, offset) {
  var condition = this.find_(buffer, offset);
  if (!condition) {
    return null;
  }

  var bytes = condition.getBytes();
  var origin = this.readUInt32BE_(buffer, offset, bytes);
  var codepoint = this.convertChar_(origin);
  return {
    consumed: bytes,
    decoded: String.fromCodePoint(codepoint)
  };
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
 * Convert the MBCS code point to Unicode code point.
 * @private
 * @param {number} chr
 * @return {number}
 */
DecodingRuleMultibyte.prototype.convertChar_ = function(chr) {
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
DecodingRuleMultibyte.prototype.getIndexingBufferOffset_ = function(seg, chr) {
  var condition = seg.getCondition();
  if (!condition) {
    return -1;
  }

  return condition.getIndexingOffset(chr);
};

exports.Multibyte = DecodingRuleMultibyte;
exports.UTF16LE = new DecodingRuleUTF16LE();
exports.UTF16BE = new DecodingRuleUTF16BE();
exports.UTF8 = new DecodingRuleUTF8();
