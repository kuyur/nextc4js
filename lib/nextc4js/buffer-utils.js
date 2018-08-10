/**
 * @author kuyur@kuyur.info
 */

'use strict';

var BufferUtils = {};

/**
 * Read 4 bytes from buffer and return an interger.
 * @param {Uint8Array} buffer Its length should be less or equal to 4. The byte
 *   order is big-endian.
 * @return {number}
 */
BufferUtils.readUInt32BE = function(buffer) {
  var length = Math.min(buffer.length, 4);
  var result = 0, bit;
  for (var i = 0; i < length; ++i) {
    result += buffer[i] << (8 * (length - 1 - i));
  }
  return result >>> 0;
};

exports.BufferUtils = BufferUtils;
