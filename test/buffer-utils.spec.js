var utils = require('../lib/buffer-utils');

describe('BufferUtils unit test', function() {
  it('readUInt32BE()', function() {
    var buffer = new Uint8Array([0x81, 0x40]);
    var codepoint = utils.readUInt32BE(buffer, 0, 2);
    expect(codepoint).toBe(0x8140);

    expect(() => {utils.readUInt32BE(buffer, 0, 4);}).toThrow('Error: exceed the buffer boundary.');
  });

  it('writeUInt32BE', function() {
    var buffer = new Uint8Array(4);
    utils.writeUInt32BE(buffer, 0, 0x8130FE39, 4);
    expect(buffer[0]).toBe(0x81);
    expect(buffer[1]).toBe(0x30);
    expect(buffer[2]).toBe(0xFE);
    expect(buffer[3]).toBe(0x39);

    expect(() => {utils.writeUInt32BE(buffer, 2, 0x8130FE39, 4);}).toThrow('Error: exceed the buffer boundary.');
  });

  it('toString()', function() {
    var buffer = new Uint32Array([0x1D306, 0x98CE]); // 𝌆 风
    var str = utils.toString(buffer);
    expect(str.length).toBe(3);
    expect(str).toBe('𝌆风');

    var chr = 0x1D306;
    var m = chr - 0x10000;
    var low = m & 0x3FF;
    var high = m >> 10;
    low += 0xDC00;
    high += 0xD800;
    expect(str.charCodeAt(0)).toBe(high);
    expect(str.charCodeAt(1)).toBe(low);
    expect(str.codePointAt(0)).toBe(0x1D306);
    expect(str[2] === '风');

    expect(utils.toString(null)).toBe(null);
  });

  it('toBuffer()', function() {
    var str = '𝌆风';
    var buffer = utils.toBuffer(str);
    expect(buffer.length).toBe(2);
    expect(buffer[0]).toBe(0x1D306);
    expect(buffer[1]).toBe(0x98CE);

    expect(utils.toBuffer(null)).toBe(null);
  });
});
