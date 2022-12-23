/**
 * @author kuyur@kuyur.info
 */

'use strict';

const {UTF8, UTF16LE, UTF16BE} = require('./encoding-rule');

/**
 * Pad zero if the length of input string is less than 2.
 * @param {string} str
 * @return {string}
 */
var padZero = function(str) {
  if (str.length === 0) {
    return '00';
  }
  if (str.length === 1) {
    return '0' + str;
  }
  return str;
};

/**
 * Convert the string to Unicode code points.
 * @param {string} str
 * @return {?Array.<number>}
 */
exports.toCodePoints = function(str) {
  if (!str) {
    return null;
  }

  var len = str.length;
  var results = [];
  var pos = 0;
  for (var i = 0; i < len; ++i) {
    var chr = str.codePointAt(i);
    results[pos++] = chr;
    if (chr > 65535) { // skip the next code unit
      i++;
    }
  }
  return results;
};

/**
 * Convert the string to UTF8 binary.
 * @param {string} str
 * @return {?Array.<number>}
 */
exports.toUTF8Binary = function(str) {
  return UTF8.unparse(str, true);
};

/**
 * Convert the string to UTF8 hex format.
 * @param {string} str
 * @return {?Array.<string>}
 */
exports.toUTF8Hex = function(str) {
  var binaryArr = UTF8.unparse(str, true);
  if (!binaryArr) {
    return null;
  }

  return binaryArr.map(code => padZero(code.toString(16).toUpperCase()));
};

/**
 * Convert the string to UTF16LE binary.
 * @param {string} str
 * @return {?Array.<number>}
 */
exports.toUTF16LEBinary = function(str) {
  return UTF16LE.unparse(str, true);
};

/**
 * Convert the string to UTF16LE hex format.
 * @param {string} str
 * @return {?Array.<string>}
 */
exports.toUTF16LEHex = function(str) {
  var binaryArr = UTF16LE.unparse(str, true);
  if (!binaryArr) {
    return null;
  }

  return binaryArr.map(code => padZero(code.toString(16).toUpperCase()));
};

/**
 * Convert the string to UTF16BE binary.
 * @param {string} str
 * @return {?Array.<number>}
 */
exports.toUTF16BEBinary = function(str) {
  return UTF16BE.unparse(str, true);
};

/**
 * Convert the string to UTF16BE hex format.
 * @param {string} str
 * @return {?Array.<string>}
 */
exports.toUTF16BEHex = function(str) {
  var binaryArr = UTF16BE.unparse(str, true);
  if (!binaryArr) {
    return null;
  }

  return binaryArr.map(code => padZero(code.toString(16).toUpperCase()));
};
