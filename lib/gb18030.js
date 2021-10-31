/**
 * @author kuyur@kuyur.info
 */

'use strict';

const { Condition } = require('./condition');
const consts = require('./consts');

var GB18030_UNICODE_SP = Condition.build(['0x90~0xE3', '0x30~0x39', '0x81~0xFE', '0x30~0x39']);

/**
 * Convert GB18030 code point (0x90~0xE3 0x30~0x39 0x81~0xFE 0x30~0x39) to
 * Unicode code point (Supplementary Plain).
 * @see https://archive.org/details/GB18030-2005
 * @param {number} chr GB18030 code point.
 * @return {number} Unicode code point.
 */
var convertGB18030ToUnicodeSP = function(chr) {
  if (chr < 0x90308130 || chr > 0xE3329A35)  {
    return consts.UNICODE_UNKNOWN_CHAR;
  }
  var offset = GB18030_UNICODE_SP.getIndexingOffset(chr);
  if (offset === -1 || offset > 0xFFFFF) {
    return consts.UNICODE_UNKNOWN_CHAR;
  }
  return offset + 0x10000;
};

/**
 * Convert Unicode code point (Supplementary Plain) to GB18030 code point.
 * @param {number} chr Unicode code point.
 * @return {number}
 */
var convertUnicodeSPToGB18030 = function(chr) {
  if (chr < 0x10000 || chr > 0x10FFFF) {
    return consts.MBCS_WHITE_SPACE.GB18030;
  }
  var offset = chr - 0x10000;
  return GB18030_UNICODE_SP.getCodePoint(offset);
};

exports.convertGB18030ToUnicodeSP = convertGB18030ToUnicodeSP;
exports.convertUnicodeSPToGB18030 = convertUnicodeSPToGB18030;
