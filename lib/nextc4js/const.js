/**
 * @author kuyur@kuyur.info
 */

'use strict';

var consts = {};

consts.UNICODE_UNKNOWN_CHAR = 0xFFFD;
consts.UNICODE_BYTE_ORDER_MARK = 0xFEFF; // U+FEFF byte order mark (BOM)
consts.UTF8_BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
consts.UTF16LE_BOM = new Uint8Array([0xFF, 0xFE]);
consts.UTF16BE_BOM = new Uint8Array([0xFE, 0xFF]);

exports.consts = consts;
