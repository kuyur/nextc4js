/**
 * @author kuyur@kuyur.info
 */

'use strict';

/**
 * Condition class.
 * @constructor
 * @param {Array.<{from:number, to:number}>} ranges
 */
var Condition = function(ranges) {
  this.bytes_ = ranges.length;
  this.ranges_ = ranges;
};

/**
 * @private
 * @type {number}
 */
Condition.prototype.bytes_;

/**
 * @private
 * @type {Array.<{from:number, to:number}>}
 */
Condition.prototype.ranges_;

/**
 * @return {number}
 */
Condition.prototype.getBytes = function() {
  return this.bytes_;
};

/**
 * Test the character match the condition or not.
 * @param {number} chr code point.
 * @return {boolean}
 */
Condition.prototype.match = function(chr) {
  if (!this.bytes_) {
    return false;
  }

  var current;
  for (var i = this.bytes_ - 1; i >= 0 ; --i) {
    current = chr & 0xFF;
    if (current < this.ranges_[i].from || current > this.ranges_[i].to) {
      return false;
    }
    chr = chr >> 8;
  }
  return true;
};

/**
 * @return {number}
 */
Condition.prototype.getBlockSize = function() {
  if (!this.bytes_) {
    return 0;
  }
  var last = this.ranges_[this.bytes_ - 1];
  return last.to - last.from + 1;
};

/**
 * @return {number}
 */
Condition.prototype.getBlockCount = function() {
  if (!this.bytes_) {
    return 0;
  }
  var count = 1;
  for (var i = 0; i < this.bytes_ - 1; ++i) {
    count = count * (this.ranges_[i].to - this.ranges_[i].from + 1);
  }
  return count;
};

/**
 * @param {number} chr
 * @return {number}
 */
Condition.prototype.getIndexingOffset = function(chr) {
  if (!this.bytes_) {
    return -1;
  }

  var carries = this.getCarries_();
  var current;
  var offset = 0;
  for (var i = this.bytes_ - 1; i >= 0 ; --i) {
    current = chr & 0xFF;
    if (current < this.ranges_[i].from || current > this.ranges_[i].to) {
      return -1;
    }
    offset += (current - this.ranges_[i].from) * carries[i];
    chr = chr >> 8;
  }
  return offset;
};

/**
 * @param {number} offset 0-based.
 * @return {number}
 */
Condition.prototype.getCodePoint = function(offset) {
  if (!this.bytes_) {
    return -1;
  }

  var carries = this.getCarries_();
  var byte,
    codepoint = 0;
  for (var i = 0; i < this.bytes_; ++i) {
    if (offset >= carries[i]) {
      byte = Math.floor(offset / carries[i]) + this.ranges_[i].from;
      codepoint |= byte << (8 * (this.bytes_ - 1 - i));
      offset = offset % carries[i];
    } else {
      byte = this.ranges_[i].from;
      codepoint |= byte << (8 * (this.bytes_ - 1 - i));
    }
  }
  return codepoint >>> 0;
};

/**
 * @private
 * @return {Array.<number>}
 */
Condition.prototype.getCarries_ = function() {
  if (!this.carries_) {
    this.carries_ = [];
    this.carries_[this.bytes_ - 1] = 1;
    for (var i = this.bytes_ - 2; i >= 0 ; --i) {
      this.carries_[i] = this.carries_[i + 1] *
        (this.ranges_[i + 1].to - this.ranges_[i + 1].from + 1);
    }
  }
  return this.carries_;
};

/**
 * Test the condition can consume the bytes inside the buffer or not.
 * @param {Uint8Array} buffer the byte order is big-endian (MBCS buffer).
 * @param {number} offset The position (pointer) to read byte inside buffer.
 * @return {boolean}
 */
Condition.prototype.consume = function(buffer, offset) {
  if (!this.bytes_) {
    return false;
  }
  if (offset + this.bytes_ > buffer.length) {
    return false;
  }
  for (var i = 0; i < this.bytes_; ++i) {
    if (buffer[offset + i] < this.ranges_[i].from ||
      buffer[offset + i] > this.ranges_[i].to) {
      return false;
    }
  }
  return true;
};

/**
 * Build a Condition instance.
 * @param {Array.<string>} condition
 * @return {?Condition}
 */
Condition.build = function(condition) {
  if (!condition || !condition.length) {
    return null;
  }

  var result = [];
  condition.forEach(function(c) {
    var parts = c.split('~');
    if (parts.length === 1) {
      var n = +parts[0];
      if (!isNaN(n)) {
        result.push({
          from: n,
          to: n
        });
      }
    } else if (parts.length === 2) {
      var from = +parts[0], to = +parts[1];
      if (!isNaN(from) && !isNaN(to) && from >= 0 && from <= 0xFF && to >= 0 && to <= 0xFF) {
        result.push({
          from: Math.min(from, to),
          to: Math.max(from, to)
        });
      }
    }
  });

  return result.length ? new Condition(result) : null;
};

exports.Condition = Condition;
