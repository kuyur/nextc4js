/**
 * @author kuyur@kuyur.info
 */

'use strict';

var BufferUtils = {};

/**
 * Read bytes from buffer and return an integer.
 * @param {Uint8Array} buffer Its length should be less or equal to 4. The byte
 *   order is big-endian.
 * @param {number} offset
 * @param {number} bytes Should not bigger than 4.
 * @return {number}
 */
BufferUtils.readUInt32BE = function(buffer, offset, bytes) {
  bytes = Math.min(bytes, 4);
  if (offset + bytes > buffer.length) {
    throw 'Error: exceed the buffer boundary.';
  }
  var result = 0;
  for (var i = 0; i < bytes; ++i) {
    result |= buffer[offset + i] << (8 * (bytes - 1 - i));
  }
  return result >>> 0;
};

exports.BufferUtils = BufferUtils;
