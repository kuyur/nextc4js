/**
 * @author kuyur@kuyur.info
 */

'use strict';

var goog = require('./goog-base.js').goog;
var Segments = require('./segment.js').Segments;
var SegmentReference = require('./segment.js').Reference;
var DECODING_RULE_UTF16LE = require('./decoding-rule').DECODING_RULE_UTF16LE;
var DECODING_RULE_UTF16BE = require('./decoding-rule').DECODING_RULE_UTF16BE;
var DECODING_RULE_UTF8 = require('./decoding-rule').DECODING_RULE_UTF8;
var DecodingRuleMultibyte = require('./decoding-rule').DecodingRuleMultibyte;

var UNKNOWN_CHAR = 0xFFFD;

/**
 * @enum {string}
 */
var Type = {
  FRONT_END: 'front-end',
  MEDIUM: 'medium',
  BACK_END: 'back-end'
};

/**
 * @constructor
 */
var Charmap = function() {};

/**
 * @private
 * @type {string}
 */
Charmap.prototype.name_;

/**
 * @private
 * @type {string}
 */
Charmap.prototype.description_;

/**
 * @private
 * @type {string}
 */
Charmap.prototype.version_;

/**
 * @private
 * @type {Type}
 */
Charmap.prototype.type_;

/**
 * Front-end Charmap class.
 * @constructor
 * @extends {Charmap}
 */
var CharmapFront = function() {
  Charmap.call(this);
  this.type_ = Type.FRONT_END;
};
goog.inherits(CharmapFront, Charmap);

/**
 * @private
 * @type {DecodingRule}
 */
CharmapFront.prototype.rule_;

/**
 * Is the buffer matched the charmap or not.
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
CharmapFront.prototype.match = goog.abstractMethod;

/**
 * Convert the buffer and return Unicode code points.
 * @param {Uint8Array} buffer
 * @return {Uint32Array}
 */
CharmapFront.prototype.convert = goog.abstractMethod;

/**
 * @constructor
 * @extends {CharmapFront}
 */
var CharmapFrontUtf16le = function() {
  CharmapFront.call(this);
  this.name_ = 'UTF-16 (little-endian)';
  this.rule_ = DECODING_RULE_UTF16LE;
};
goog.inherits(CharmapFrontUtf16le, CharmapFront);

/**
 * Is the buffer matched the charmap or not.
 * @override
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
CharmapFrontUtf16le.prototype.match = function(buffer) {
  return this.rule_.test(buffer) !== -1;
};

/**
 * Convert the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @return {Uint32Array}
 */
CharmapFrontUtf16le.prototype.convert = function(buffer) {
  return this.rule_.decode(buffer);
};

/**
 * @constructor
 * @extends {CharmapFront}
 */
var CharmapFrontUtf16be = function() {
  CharmapFront.call(this);
  this.name_ = 'UTF-16 (big-endian)';
  this.rule_ = DECODING_RULE_UTF16BE;
};
goog.inherits(CharmapFrontUtf16be, CharmapFront);

/**
 * Is the buffer matched the charmap or not.
 * @override
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
CharmapFrontUtf16be.prototype.match = function(buffer) {
  return this.rule_.test(buffer) !== -1;
};

/**
 * Convert the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @return {Uint32Array}
 */
CharmapFrontUtf16be.prototype.convert = function(buffer) {
  return this.rule_.decode(buffer);
};

/**
 * @constructor
 * @extends {CharmapFront}
 */
var CharmapFrontUtf8 = function() {
  CharmapFront.call(this);
  this.name_ = 'UTF-8';
  this.rule_ = DECODING_RULE_UTF8;
};

/**
 * Is the buffer matched the charmap or not.
 * @override
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
CharmapFrontUtf8.prototype.match = function(buffer) {
  return this.rule_.test(buffer) !== -1;
};

/**
 * Convert the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @return {Uint32Array}
 */
CharmapFrontUtf8.prototype.convert = function(buffer) {
  return this.rule_.decode(buffer);
};

/**
 * Front-end MBCS Charmap class.
 * @param {Object} options
 * @param {Uint8Array} mappingBuffer
 * @constructor
 * @extends {CharmapFront}
 */
var CharmapFrontMultibyte = function(options, mappingBuffer) {
  CharmapFront.call(this);
  if (!options || !options['name']) {
    throw 'options should provide name property at least';
  }

  this.name_ = options['name'];
  this.description_ = options['description'];
  this.version_ = options['version'];
  this.rule_ = new DecodingRuleMultibyte(options['rules']);
  this.segments_ = new Segments(options['segments']);
  this.mappingBuffer_ = mappingBuffer;
};
goog.inherits(CharmapFrontMultibyte, CharmapFront);

/**
 * The mapping buffer to convert code point.
 * @private
 * @type {Uint16Array}
 */
CharmapFrontMultibyte.prototype.mappingBuffer_;

/**
 * @private
 * @type {Segments}
 */
CharmapFrontMultibyte.prototype.segments_;

/**
 * Is the buffer matched the MBCS charmap or not. If there is any code point
 * mapped to 0xFFFD, it is considered that buffer is not matched.
 * @override
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
CharmapFrontMultibyte.prototype.match = function(buffer) {
  // TODO
};

/**
 * Convert the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @return {Uint32Array}
 */
CharmapFrontMultibyte.prototype.convert = function(buffer) {
  var decoded = this.rule_.decode(buffer);
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
CharmapFrontMultibyte.prototype.convertChar_ = function(chr) {
  chr = chr >>> 0;
  var segment = this.segments_.find(chr);
  if (!segment) {
    return UNKNOWN_CHAR;
  }

  switch (segment.getReference()) {
    case SegmentReference.ASCII:
      return chr & 0x7F;
    case SegmentReference.UNDEFINED:
      return UNKNOWN_CHAR;
    case SegmentReference.BUFFER:
      if (!this.mappingBuffer_) {
        return UNKNOWN_CHAR;
      }
      var offset = chr - segment.getBegin() + segment.getOffset();
      return this.mappingBuffer_[offset];
    case SegmentReference.INDEXING_BUFFER:
      if (!this.mappingBuffer_) {
        return UNKNOWN_CHAR;
      }
      var offset = this.getIndexingBufferOffset_(segment, chr);
      if (offset === -1) {
        return UNKNOWN_CHAR;
      }
      return this.mappingBuffer_[offset];
    case SegmentReference.SELF:
      return chr;
    case SegmentReference.GB18030_UNICODE_SP_MAPPING:
      return ConvertGB18030ToUnicodeSP(chr);
    default:
      return UNKNOWN_CHAR;
  }
};

/**
 * @private
 * @param {Segment} segment
 * @param {number} chr
 * @return {number}
 */
CharmapFrontMultibyte.prototype.getIndexingBufferOffset_ = function(segment, chr) {
  var condition = segment.getCondition();
  if (!condition) {
    return -1;
  }

  var offset = condition.getIndexingOffset(chr);
  if (offset === -1) {
    return -1;
  }
  return offset + segment.getOffset();
};

/**
 * @param {number} chr GB18030 code point.
 * @return {number} Unicode code point.
 */
var ConvertGB18030ToUnicodeSP = function(chr) {
  // TODO
  return UNKNOWN_CHAR;
};

exports.UTF16LE = new CharmapFrontUtf16le();
exports.UTF16BE = new CharmapFrontUtf16be();
exports.UTF8 = new CharmapFrontUtf8();
exports.Multibyte = CharmapFrontMultibyte;
