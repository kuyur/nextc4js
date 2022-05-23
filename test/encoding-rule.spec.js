var encodingrule = require('../lib/encoding-rule');

describe('EncodingRule.UTF16LE unit test', function() {
  it('test()', function() {
    var buffer = new Uint32Array([0x1D306]);
    expect(encodingrule.UTF16LE.test(buffer)).toBe(4);
  });

  it('encode()', function() {
    var buffer = new Uint32Array([0x1D306]);
    var uint8array = encodingrule.UTF16LE.encode(buffer);
    expect(uint8array instanceof Uint8Array).toBe(true);
    expect(uint8array.length).toBe(4);
    expect(uint8array[0]).toBe(0x34);
    expect(uint8array[1]).toBe(0xD8);
    expect(uint8array[2]).toBe(0x06);
    expect(uint8array[3]).toBe(0xDF);
  });

  it('encode() - invalid', function() {
    var uint8array = encodingrule.UTF16LE.encode({a: 'an object'});
    expect(uint8array).toBeNull();
  });
});

describe('EncodingRule.UTF16BE unit test', function() {
  it('test()', function() {
    var buffer = new Uint32Array([0x1D306]);
    expect(encodingrule.UTF16BE.test(buffer)).toBe(4);
  });

  it('encode()', function() {
    var buffer = new Uint32Array([0x1D306]);
    var uint8array = encodingrule.UTF16BE.encode(buffer);
    expect(uint8array instanceof Uint8Array).toBe(true);
    expect(uint8array.length).toBe(4);
    expect(uint8array[0]).toBe(0xD8);
    expect(uint8array[1]).toBe(0x34);
    expect(uint8array[2]).toBe(0xDF);
    expect(uint8array[3]).toBe(0x06);
  });

  it('encode() - invalid', function() {
    var uint8array = encodingrule.UTF16BE.encode({a: 'an object'});
    expect(uint8array).toBeNull();
  });
});

describe('EncodingRule.UTF8 unit test', function() {
  it('test()', function() {
    var buffer = new Uint32Array([0x1D306]);
    expect(encodingrule.UTF8.test(buffer)).toBe(4);
  });

  it('encode()', function() {
    var buffer = new Uint32Array([0x1D306]);
    var uint8array = encodingrule.UTF8.encode(buffer);
    expect(uint8array instanceof Uint8Array).toBe(true);
    expect(uint8array.length).toBe(4);
    expect(uint8array[0]).toBe(0xF0);
    expect(uint8array[1]).toBe(0x9D);
    expect(uint8array[2]).toBe(0x8C);
    expect(uint8array[3]).toBe(0x86);
  });

  it('encode() - invalid', function() {
    var uint8array = encodingrule.UTF8.encode({a: 'an object'});
    expect(uint8array).toBeNull();
  });
});
