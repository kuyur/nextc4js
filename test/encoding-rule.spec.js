var encodingrule = require('../lib/encoding-rule');

describe('EncodingRule.UTF16LE unit test', function() {
  it('test()', function() {
    var buffer = new Uint32Array([0x1D306]);
    expect(encodingrule.UTF16LE.test(buffer)).toBe(4);

    expect(encodingrule.UTF16LE.test([0x1D306])).toBe(4);
    expect(encodingrule.UTF16LE.test([])).toBe(0);
    expect(encodingrule.UTF16LE.test([0xD800, 0xDFFF])).toBe(0);
    expect(encodingrule.UTF16LE.test([0x110000])).toBe(0);
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

    var uint8array2 = encodingrule.UTF16LE.encode([0x20, 0xD800, 0xDFFF, 0x110000, 0x21]);
    expect(uint8array2 instanceof Uint8Array).toBe(true);
    expect(uint8array2.length).toBe(4);
    expect(uint8array2[0]).toBe(0x20);
    expect(uint8array2[1]).toBe(0x00);
    expect(uint8array2[2]).toBe(0x21);
    expect(uint8array2[3]).toBe(0x00);
  });

  it('encode() - invalid', function() {
    var uint8array = encodingrule.UTF16LE.encode({a: 'an object'});
    expect(uint8array).toBeNull();
  });

  it('unparse()', function() {
    var uint8array = encodingrule.UTF16LE.unparse(null);
    expect(uint8array).toBeNull();

    var uint8array2 = encodingrule.UTF16LE.unparse('abcαβγ中文𠂇𠂉𠃌');
    expect(uint8array2.length).toBe(8 * 2 + 3 * 4);
  });
});

describe('EncodingRule.UTF16BE unit test', function() {
  it('test()', function() {
    var buffer = new Uint32Array([0x1D306]);
    expect(encodingrule.UTF16BE.test(buffer)).toBe(4);

    expect(encodingrule.UTF16BE.test([0x1D306])).toBe(4);
    expect(encodingrule.UTF16BE.test([])).toBe(0);
    expect(encodingrule.UTF16BE.test([0xD800, 0xDFFF])).toBe(0);
    expect(encodingrule.UTF16BE.test([0x110000])).toBe(0);
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

    var uint8array2 = encodingrule.UTF16BE.encode([0x20, 0xD800, 0xDFFF, 0x110000, 0x21]);
    expect(uint8array2 instanceof Uint8Array).toBe(true);
    expect(uint8array2.length).toBe(4);
    expect(uint8array2[0]).toBe(0x00);
    expect(uint8array2[1]).toBe(0x20);
    expect(uint8array2[2]).toBe(0x00);
    expect(uint8array2[3]).toBe(0x21);
  });

  it('encode() - invalid', function() {
    var uint8array = encodingrule.UTF16BE.encode({a: 'an object'});
    expect(uint8array).toBeNull();
  });

  it('unparse()', function() {
    var uint8array = encodingrule.UTF16BE.unparse(null);
    expect(uint8array).toBeNull();

    var uint8array2 = encodingrule.UTF16BE.unparse('abcαβγ中文𠂇𠂉𠃌');
    expect(uint8array2.length).toBe(8 * 2 + 3 * 4);
  });
});

describe('EncodingRule.UTF8 unit test', function() {
  it('test()', function() {
    var buffer = new Uint32Array([0x1D306]);
    expect(encodingrule.UTF8.test(buffer)).toBe(4);

    expect(encodingrule.UTF8.test([0x1D306])).toBe(4);
    expect(encodingrule.UTF8.test([])).toBe(0);
    expect(encodingrule.UTF8.test([0xD800, 0xDFFF])).toBe(0);
    expect(encodingrule.UTF8.test([0x110000])).toBe(0);
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

    var uint8array2 = encodingrule.UTF8.encode([0x20, 0xD800, 0xDFFF, 0x110000, 0x21]);
    expect(uint8array2 instanceof Uint8Array).toBe(true);
    expect(uint8array2.length).toBe(2);
    expect(uint8array2[0]).toBe(0x20);
    expect(uint8array2[1]).toBe(0x21);
  });

  it('encode() - invalid', function() {
    var uint8array = encodingrule.UTF8.encode({a: 'an object'});
    expect(uint8array).toBeNull();
  });

  it('unparse()', function() {
    var uint8array = encodingrule.UTF8.unparse(null);
    expect(uint8array).toBeNull();

    var uint8array2 = encodingrule.UTF8.unparse('abcαβγ中文𠂇𠂉𠃌');
    expect(uint8array2.length).toBe(3 + 3 * 2 + 2 * 3 + 3 * 4);
  });
});
