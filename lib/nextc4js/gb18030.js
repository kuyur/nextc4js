/**
 * @author kuyur@kuyur.info
 */

'use strict';

var consts = require('./const.js').consts;
var Condition = require('./condition.js').Condition;
var gb18030utils = {};

var GB18030_UNICODE_SP = Condition.build(['0x90~0xE3', '0x30~0x39', '0x81~0xFE', '0x30~0x39']);

/**
 * Convert GB18030 code point (0x90~0xE3 0x30~0x39 0x81~0xFE 0x30~0x39) to
 * Unicode code point (Supplementary Plain).
 * @see https://archive.org/details/GB18030-2005
 * @param {number} chr GB18030 code point.
 * @return {number} Unicode code point.
 */
gb18030utils.convertGB18030ToUnicodeSP = function(chr) {
  if (chr < 0x90308130 || chr > 0xE3329A35)  {
    return consts.UNICODE_UNKNOWN_CHAR;
  }
  var offset = GB18030_UNICODE_SP.getIndexingOffset(chr);
  if (offset === -1 || offset > 0xFFFFF) {
    return consts.UNICODE_UNKNOWN_CHAR;
  }
  return offset + 0x10000;
};

exports.gb18030utils = gb18030utils;
