'use strict';

/**
 * @author kuyur@kuyur.info
 */

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
 * Test the character match the condition or not.
 * @param {number|Uint8Array} chr code point. when it is a Uint8Array, the byte
 *   order is big-endian.
 * @return {boolean}
 */
Condition.prototype.match = function(chr) {
  if (!this.bytes_) {
    return false;
  }

  if (chr instanceof Uint8Array) {
    if (chr.length !== this.bytes_) {
      return false;
    }
    return chr.every(function(value, index) {
      var range = this.ranges_[index];
      return value >= range.from && value <= range.to;
    }, this);
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
        })
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

module.export = Condition;
