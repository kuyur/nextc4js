/**
 * The base64 encoding/decoding implementation for browser environment.
 * The encode method accepts an Uint8Array as input.
 * The decode method outputs an Uint8Array as result.
 * @author kuyur@kuyur.info
 * @see https://en.wikipedia.org/wiki/Base64
 */

/**
 * the index table of base64 (000000 ~ 111111) to accelerate the converting.
 * @type {string}
 */
const mapping = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * the padding character.
 * @type {string}
 */
const padding = '=';

/**
 * Encode a binary array into base64.
 * @param {Uint8Array} buffer Binary buffer.
 * @return {string} The encoded base64 string.
 */
exports.encode = function(buffer) {
  if (!buffer) {
    return '';
  }
  var length = buffer.length;
  if (!length) {
    return '';
  }

  var result = [],
    tail = length % 3,
    end = length - tail,
    uint24 = 0,
    offset = 0;
  for (var i = 0; i < end; i += 3) {
    uint24 = (buffer[i] << 16) | (buffer[i+1] << 8) | buffer[i+2];
    result[offset++] = mapping[(uint24 >>> 18) & 0x3F];
    result[offset++] = mapping[(uint24 >>> 12) & 0x3F];
    result[offset++] = mapping[(uint24 >>> 6) & 0x3F];
    result[offset++] = mapping[uint24 & 0x3F];
  }
  if (tail === 1) {
    result[offset++] = mapping[(buffer[end] >>> 2) & 0x3F];
    result[offset++] = mapping[(buffer[end] << 4) & 0x30];
    result[offset++] = padding;
    result[offset] = padding;
  } else if (tail === 2) {
    result[offset++] = mapping[(buffer[end] >>> 2) & 0x3F];
    result[offset++] = mapping[((buffer[end] << 4) & 0x30) | ((buffer[end + 1] >>> 4) & 0xF)];
    result[offset++] = mapping[(buffer[end + 1] << 2) &0x3C];
    result[offset] = padding;
  }

  return result.join('');
};

/**
 * The reversed mapping.
 * @type {Object.<string, number>}
 */
const decoding_mapping = (function() {
  var result = {};
  for (var i = 0; i < 64; ++i) {
    result[mapping[i]] = i;
  }
  return result;
})();

/**
 * Decode a base64 encoded string and return binary array. Supporting the string
 * which is not padded with "=".
 * @param {string} string The encoded base64 string.
 * @return {Uint8Array} The decoded binary buffer.
 */
exports.decode = function(string) {
  if (!string) {
    return new Uint8Array(0);
  }
  var length = string.length;
  if (!length) {
    return new Uint8Array(0);
  }

  if (string.endsWith('==')) {
    string = string.substring(0, length - 2);
    length -= 2;
  } else if (string.endsWith('=')) {
    string = string.substring(0, length - 1);
    length -= 1;
  }

  var tail = length % 4;
  var total = Math.floor(length / 4) * 3;
  if (tail !== 0) {
    if (tail === 1) {
      throw 'Invalid base64 string.';
    }
    // check last 6 bits
    var bit6_last = decoding_mapping[string[length - 1]];
    if (bit6_last === undefined) {
      throw 'Invalid base64 string.';
    }
    if (tail === 2 && ((bit6_last & 0xF) !== 0)) {
      throw 'Invalid base64 string.';
    }
    if (tail === 3 && ((bit6_last & 0x3) !== 0)) {
      throw 'Invalid base64 string.';
    }
    total += tail === 2 ? 1 : 2;
  }

  var buffer = new Uint8Array(total),
    end = length - tail,
    uint24 = 0,
    bit6_1,
    bit6_2,
    bit6_3,
    bit6_4,
    offset = 0;
  for (var i = 0; i < end; i += 4) {
    bit6_1 = decoding_mapping[string[i]];
    bit6_2 = decoding_mapping[string[i + 1]];
    bit6_3 = decoding_mapping[string[i + 2]];
    bit6_4 = decoding_mapping[string[i + 3]];
    if (bit6_1 === undefined || bit6_2 === undefined || bit6_3 === undefined || bit6_4 === undefined) {
      throw 'Invalid base64 string.';
    }

    uint24 = (bit6_1 << 18) | (bit6_2 << 12) | (bit6_3 << 6) | bit6_4;
    buffer[offset++] = (uint24 >>> 16) & 0xFF;
    buffer[offset++] = (uint24 >>> 8) & 0xFF;
    buffer[offset++] = uint24 & 0xFF;
  }
  if (tail === 2) {
    bit6_1 = decoding_mapping[string[end]];
    bit6_2 = decoding_mapping[string[end + 1]];
    if (bit6_1 === undefined) {
      throw 'Invalid base64 string.';
    }
    buffer[offset] = (bit6_1 << 2) | (bit6_2 >>> 4);
  } else if (tail === 3) {
    bit6_1 = decoding_mapping[string[end]];
    bit6_2 = decoding_mapping[string[end + 1]];
    bit6_3 = decoding_mapping[string[end + 2]];
    if (bit6_1 === undefined || bit6_2 === undefined) {
      throw 'Invalid base64 string.';
    }
    buffer[offset++] = (bit6_1 << 2) | (bit6_2 >>> 4);
    buffer[offset] = ((bit6_2 & 0xF) << 4) | (bit6_3 >>> 2);
  }

  return buffer;
};
