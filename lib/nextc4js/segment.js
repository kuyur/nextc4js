/**
 * Segment class.
 * @author kuyur@kuyur.info
 */

'use strict';

var condition = require('./condition');

/**
 * @enum {string}
 */
var Reference = {
  ASCII: 'ascii',
  UNDEFINED: 'undefined',
  BUFFER: 'buffer',
  INDEXING_BUFFER: 'indexing-buffer',
  SELF: 'self',
  GB18030_UNICODE_SP_MAPPING: 'gb18030-unicode-sp-mapping'
};

/**
 * @constructor
 * @param {Object} options
 */
var Segment = function(options) {
  this.begin_ = options.begin;
  this.end_ = options.end;
  this.condition_ = condition.Condition.build(options.condition);
  this.reference_ = options.reference;
  this.offset_ = options.offset;
  this.characterset_ = options.characterset;
  this.bytes_ = options.bytes;
};

/**
 * @private
 * @type {number}
 */
Segment.prototype.begin_;

/**
 * @private
 * @type {number}
 */
Segment.prototype.end_;

/**
 * @private
 * @type {?condition.Condition}
 */
Segment.prototype.condition_;

/**
 * @private
 * @type {Reference}
 */
Segment.prototype.reference_;

/**
 * @private
 * @type {number}
 */
Segment.prototype.offset_;

/**
 * @private
 * @type {string}
 */
Segment.prototype.characterset_;

/**
 * Bytes per character. Only used in encoding rule.
 * @private
 * @type {?number}
 */
Segment.prototype.bytes_;

/**
 * @return {number}
 */
Segment.prototype.getBegin = function() {
  return this.begin_;
};

/**
 * @return {number}
 */
Segment.prototype.getEnd = function() {
  return this.end_;
};

/**
 * @return {number}
 */
Segment.prototype.getOffset = function() {
  return this.offset_;
};

/**
 * @return {Reference}
 */
Segment.prototype.getReference = function() {
  return this.reference_;
};

/**
 * @return {condition.Condition}
 */
Segment.prototype.getCondition = function() {
  return this.condition_;
};

/**
 * @return {?number}
 */
Segment.prototype.getBytes = function() {
  return this.bytes_;
};

/**
 * @constructor
 * @param {Array.<Object|Segment>} options
 */
var Segments = function(options) {
  this.segments_ = [];
  if (options) {
    options.forEach(function(segment) {
      if (!(segment instanceof Segment)) {
        segment = new Segment(segment);
      }
      this.segments_.push(segment);
    }, this);
  }
};

/**
 * @private
 * @type {Array.<Segment>}
 */
Segments.prototype.segments_;

/**
 * find the matched Segment.
 * @param {number} chr code point.
 * @return {?Segment}
 */
Segments.prototype.find = function(chr) {
  for (var i = 0, len = this.segments_.length; i < len; ++i) {
    if (chr >= this.segments_[i].begin_ && chr <= this.segments_[i].end_) {
      if (!this.segments_[i].condition_ || this.segments_[i].condition_.match(chr)) {
        return this.segments_[i];
      }
    }
  }

  return null;
};

exports.Reference = Reference;
exports.Segment = Segment;
exports.Segments = Segments;
