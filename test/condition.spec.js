var condition = require('../lib/nextc4js/condition');
var bufferutils = require('../lib/nextc4js/buffer-utils');

var option = ['0x81~0x84', '0x30~0x39', '0x81~0xFE', '0x30~0x39'];
var option2 = ['0x90~0xE3', '0x30~0x39', '0x81~0xFE', '0x30~0x39'];

describe('Condition unit test', function() {
  it('getIndexingOffset() - case1', function() {
    var buffer = new Uint8Array([0x81, 0x30, 0x81, 0x30]);
    var chr = bufferutils.readUInt32BE(buffer, 0, 4);
    var con = condition.Condition.build(option);
    expect(con.getIndexingOffset(chr)).toBe(0);
  });

  it('getIndexingOffset() - case2', function() {
    var buffer = new Uint8Array([0x84, 0x39, 0xFE, 0x39]);
    var chr = bufferutils.readUInt32BE(buffer, 0, 4);
    var con = condition.Condition.build(option);
    expect(con.getIndexingOffset(chr)).toBe(50399);
  });

  it('getIndexingOffset() - case3', function() {
    var buffer = new Uint8Array([0x81, 0x30, 0x40, 0x30]);
    var chr = bufferutils.readUInt32BE(buffer, 0, 4);
    var con = condition.Condition.build(option);
    expect(con.getIndexingOffset(chr)).toBe(-1);
  });

  it('getCodePoint()', function() {
    var con = condition.Condition.build(option2);
    expect(con.getCodePoint(0x10000 - 0x10000)).toBe(0x90308130);
    expect(con.getCodePoint(0x10FFFF - 0x10000)).toBe(0xE3329A35);
  });
});
