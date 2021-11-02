/**
 * @author kuyur@kuyur.info
 */

'use strict';

const { Charmap, CharmapType} = require('./charmap');
const consts = require('./consts');
const goog = require('./goog-base');
const segment = require('./segment');

/**
 * The Converter class. Converter is basing on Unicode.
 * @param {{
 *   name: string,
 *   description: string,
 *   version: string,
 *   buffer: Uint16Array|Uint32Array,
 *   segments: Array.<Object>
 * }} options
 * @constructor
 * @extends {Charmap}
 */
var Converter = function(options) {
  if (!options || !options['name']) {
    throw 'options should provide name property at least';
  }
  Charmap.call(this, options['name'], CharmapType.CONVERTER);

  this.description_ = options['description'];
  this.version_ = options['version'];
  this.segments_ = new segment.Segments(options['segments']);
  this.mappingBuffer_ = options['buffer'];
};
goog.inherits(Converter, Charmap);

/**
 * @private
 * @type {string}
 */
Converter.prototype.description_;

/**
 * @private
 * @type {string}
 */
Converter.prototype.version_;

/**
 * @private
 * @type {segment.Segments}
 */
Converter.prototype.segments_;

/**
 * @private
 * @type {Unit32Array|Uint16Array}
 */
Converter.prototype.mappingBuffer_;

/**
 * Get bytes of one code point inside buffer.
 * @return {number}
 */
Converter.prototype.getBytesOfCodepoint = function() {
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
 * Convert Unicode code points.
 * @override
 * @param {Uint32Array} buffer
 * @return {?Uint32Array}
 */
Converter.prototype.convert = function(buffer) {
  if (!buffer) {
    return null;
  }

  var result = new Uint32Array(buffer.length);
  for (var i = 0, len = buffer.length; i < len; ++i) {
    result[i] = this.convertChar_(buffer[i]);
  }

  return result;
};

/**
 * Convert a Unicode code point.
 * @private
 * @param {number} chr
 * @return {number}
 */
Converter.prototype.convertChar_ = function(chr) {
  chr = chr >>> 0;
  var seg = this.segments_.find(chr);
  if (!seg) {
    return consts.UNICODE_UNKNOWN_CHAR;
  }

  switch (seg.getReference()) {
    case segment.Reference.SELF:
      return chr;
    case segment.Reference.BUFFER:
      if (!this.mappingBuffer_) {
        return consts.UNICODE_UNKNOWN_CHAR;
      }
      return this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()];
    default:
      return consts.UNICODE_UNKNOWN_CHAR;
  }
};

exports.Converter = Converter;
