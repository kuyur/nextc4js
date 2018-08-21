/**
 * @author kuyur@kuyur.info
 */

'use strict';

var charmap = require('./charmap');
var consts = require('./const');
var decodingrule = require('./decoding-rule');
var gb18030utils = require('./gb18030');
var goog = require('./goog-base');
var segment = require('./segment');

/**
 * Front-end Charmap class.
 * @constructor
 * @param {string} name
 * @extends {charmap.Charmap}
 */
var Decoder = function(name) {
  charmap.Charmap.call(this, name, charmap.CharmapType.FRONT_END);
};
goog.inherits(Decoder, charmap.Charmap);

/**
 * @private
 * @type {decodingrule.DecodingRule}
 */
Decoder.prototype.rule_;

/**
 * Is the buffer matched the charmap or not.
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
Decoder.prototype.match = goog.abstractMethod;

/**
 * Decode the buffer and return Unicode code points.
 * @param {Uint8Array} buffer
 * @return {Uint32Array}
 */
Decoder.prototype.decode = goog.abstractMethod;

/**
 * @constructor
 * @extends {Decoder}
 */
var DecoderUtf16le = function() {
  Decoder.call(this, 'UTF-16 (little-endian)');
  this.rule_ = decodingrule.UTF16LE;
};
goog.inherits(DecoderUtf16le, Decoder);

/**
 * Is the buffer matched the charmap or not.
 * @override
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
DecoderUtf16le.prototype.match = function(buffer) {
  return this.rule_.test(buffer) !== -1;
};

/**
 * Decode the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @return {Uint32Array}
 */
DecoderUtf16le.prototype.decode = function(buffer) {
  return this.rule_.decode(buffer);
};

/**
 * @constructor
 * @extends {Decoder}
 */
var DecoderUtf16be = function() {
  Decoder.call(this, 'UTF-16 (big-endian)');
  this.rule_ = decodingrule.UTF16BE;
};
goog.inherits(DecoderUtf16be, Decoder);

/**
 * Is the buffer matched the charmap or not.
 * @override
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
DecoderUtf16be.prototype.match = function(buffer) {
  return this.rule_.test(buffer) !== -1;
};

/**
 * Decode the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @return {Uint32Array}
 */
DecoderUtf16be.prototype.decode = function(buffer) {
  return this.rule_.decode(buffer);
};

/**
 * @constructor
 * @extends {Decoder}
 */
var DecoderUtf8 = function() {
  Decoder.call(this, 'UTF-8');
  this.rule_ = decodingrule.UTF8;
};

/**
 * Is the buffer matched the charmap or not.
 * @override
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
DecoderUtf8.prototype.match = function(buffer) {
  return this.rule_.test(buffer) !== -1;
};

/**
 * Decode the buffer and return Unicode code points.
 * @override
 * @param {Uint8Array} buffer
 * @return {Uint32Array}
 */
DecoderUtf8.prototype.decode = function(buffer) {
  return this.rule_.decode(buffer);
};

/**
 * Front-end MBCS Charmap class.
 * @param {Object} options
 * @param {Uint16Array} mappingBuffer
 * @constructor
 * @extends {Decoder}
 */
var DecoderMultibyte = function(options, mappingBuffer) {
  if (!options || !options['name']) {
    throw 'options should provide name property at least';
  }
  Decoder.call(this, options['name']);

  this.description_ = options['description'];
  this.version_ = options['version'];
  this.rule_ = new decodingrule.Multibyte(options['rules']);
  this.segments_ = new segment.Segments(options['segments']);
  this.mappingBuffer_ = mappingBuffer;
};
goog.inherits(DecoderMultibyte, Decoder);

/**
 * The mapping buffer to convert code point.
 * @private
 * @type {Uint16Array}
 */
DecoderMultibyte.prototype.mappingBuffer_;

/**
 * @private
 * @type {segment.Segments}
 */
DecoderMultibyte.prototype.segments_;

/**
 * Is the buffer matched the MBCS charmap or not. If there is any code point
 * mapped to 0xFFFD, it is considered that buffer is not matched.
 * @override
 * @param {Uint8Array} buffer
 * @return {boolean}
 */
DecoderMultibyte.prototype.match = function(buffer) {
  var decoded = this.rule_.decode(buffer);
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
 * @return {Uint32Array}
 */
DecoderMultibyte.prototype.decode = function(buffer) {
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
exports.Multibyte = DecoderMultibyte;
