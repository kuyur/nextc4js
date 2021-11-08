/**
 * @author kuyur@kuyur.info
 */

'use strict';

exports.UNICODE_UNKNOWN_CHAR = 0xFFFD;
exports.UNICODE_BYTE_ORDER_MARK = 0xFEFF; // U+FEFF byte order mark (BOM)
exports.UTF8_BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
exports.UTF16LE_BOM = new Uint8Array([0xFF, 0xFE]);
exports.UTF16BE_BOM = new Uint8Array([0xFE, 0xFF]);
exports.MBCS_UNKNOWN_CHAR = 0x3F; // ?
exports.MBCS_WHITE_SPACE = {
  GBK: 0xA1A1, // GBK full-width whitespace
  GB18030: 0xA1A1
};
exports.EMBEDDED_BASE64_PREFIX = 'data:application/octet-stream;base64,';
