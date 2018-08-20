/**
 * @author kuyur@kuyur.info
 */

'use strict';

var goog = require('./goog-base.js').goog;
var Charmap = require('./charmap.js').Charmap;
var CharmapType = require('./charmap.js').CharmapType;
var ENCODING_RULE_UTF16LE = require('./encoding-rule.js').ENCODING_RULE_UTF16LE;
var ENCODING_RULE_UTF16BE = require('./encoding-rule.js').ENCODING_RULE_UTF16BE;
var ENCODING_RULE_UTF8 = require('./encoding-rule.js').ENCODING_RULE_UTF8;

/**
 * Back-end Charmap class.
 * @constructor
 * @param {string} name
 * @extends {Charmap}
 */
var CharmapBack = function(name) {
  Charmap.call(this, name, CharmapType.BACK_END);
};
goog.inherits(CharmapBack, Charmap);

/**
 * @private
 * @type {EncodingRule}
 */
CharmapBack.prototype.rule_;

/**
 * Encode the Unicode code points and return encoded buffer.
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
CharmapBack.prototype.convert = goog.abstractMethod;

/**
 * @constructor
 * @extends {CharmapBack}
 */
var CharmapBackUtf16le = function() {
  CharmapBack.call(this, 'UTF-16 (little-endian');
  this.rule_ = ENCODING_RULE_UTF16LE;
};

/**
 * @override
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
CharmapBackUtf16le.prototype.convert = function(buffer) {
  return this.rule_.encode(buffer);
};

/**
 * @constructor
 * @extends {CharmapBack}
 */
var CharmapBackUtf16be = function() {
  CharmapBack.call(this, 'UTF-16 (little-endian');
  this.rule_ = ENCODING_RULE_UTF16BE;
};

/**
 * @override
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
CharmapBackUtf16be.prototype.convert = function(buffer) {
  return this.rule_.encode(buffer);
};

/**
 * @constructor
 * @extends {CharmapBack}
 */
var CharmapBackUtf8 = function() {
  CharmapBack.call(this, 'UTF-8');
  this.rule_ = ENCODING_RULE_UTF8;
};

/**
 * @override
 * @param {Uint32Array} buffer
 * @return {Uint8Array}
 */
CharmapBackUtf8.prototype.convert = function(buffer) {
  return this.rule_.encode(buffer);
};

exports.UTF16LE = new CharmapBackUtf16le();
exports.UTF16BE = new CharmapBackUtf16be();
exports.UTF8 = new CharmapBackUtf8();
