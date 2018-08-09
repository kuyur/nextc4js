'use strict';

var Condition = require('./condition.js');

/**
 * Segment class.
 * @author kuyur@kuyur.info
 */

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
  this.condition_ = Condition.build(options.condition);
  this.reference_ = options.reference;
  this.characterset_ = options.characterset;
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
 * @type {?Condition}
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
 * @return {Reference}
 */
Segment.prototype.getReference = function() {
  return this.reference_;
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
 * @param {number|Uint8Array} chr code point. when it is a Uint8Array, the byte
 *   order is big-endian.
 * @return {?Segment}
 */
Segments.prototype.find = function(chr) {
  if (chr instanceof Uint8Array) {
    var buffer = Buffer.from(chr);
    chr = buffer.readUInt32BE(0);
  }

  for (var i = 0, len = this.segments_.length; i < len; ++i) {
    if (chr >= this.segments_[i].begin_ && chr <= this.segments_[i].end_) {
      if (!this.segments_[i].condition_ || this.segments_.condition_.match(chr)) {
        return this.segments_[i];
      }
    }
  }

  return null;
};

module.export = {
  Reference: Reference,
  Segment: Segment,
  Segments: Segments
};
