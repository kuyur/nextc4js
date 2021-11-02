/**
 * @author kuyur@kuyur.info
 */

'use strict';

/**
 * Read bytes from buffer and return an integer.
 * @param {Uint8Array} buffer The byte order is big-endian.
 * @param {number} offset
 * @param {number} bytes Should not bigger than 4.
 * @return {number}
 */
exports.readUInt32BE = function(buffer, offset, bytes) {
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

/**
 * Write a codepoint into buffer.
 * @param {Uint8Array} buffer The byte order is big-endian.
 * @param {number} offset
 * @param {number} chr codepoint.
 * @param {number} bytes Should not bigger than 4.
 */
exports.writeUInt32BE = function(buffer, offset, chr, bytes) {
  bytes = Math.min(bytes, 4);
  if (offset + bytes > buffer.length) {
    throw 'Error: exceed the buffer boundary.';
  }
  for (var i = bytes - 1; i >= 0; i--) {
    buffer[offset + i] = chr & 0xFF;
    chr = chr >>> 8;
  }
};

/**
 * Convert the Unicode code points buffer to string.
 * @param {Uint32Array|Array.<number>} buffer
 * @return {?string}
 */
exports.toString = function(buffer) {
  if (!buffer) {
    return null;
  }

  var chrs = [];
  for (var i = 0, len = buffer.length; i < len; ++i) {
    chrs[i] = String.fromCodePoint(buffer[i]);
  }

  return chrs.join('');
};

/**
 * Convert the string to Unicode code points buffer.
 * @param {string} str
 * @return {?Uint32Array}
 */
exports.toBuffer = function(str) {
  if (!str) {
    return null;
  }

  var len = str.length;
  var buffer = new Uint32Array(len);
  var pos = 0;
  for (var i = 0; i < len; ++i) {
    var chr = str.codePointAt(i);
    buffer[pos++] = chr;
    if (chr > 65535) { // skip the next code unit
      i++;
    }
  }
  return buffer.slice(0, pos);
};
