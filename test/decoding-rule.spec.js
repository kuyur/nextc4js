var decodingrule = require('../lib/decoding-rule');

var rules = [
  {
    'byte': 1,
    'condition': ['0x00~0x80']
  }, {
    'byte': 1,
    'condition': ['0xFF']
  }, {
    'byte': 2,
    'condition': ['0x81~0xFE', '0x40~0xFE']
  }, {
    'byte': 4,
    'condition': ['0x81~0xFE', '0x30~0x39', '0x81~0xFE', '0x30~0x39']
  }
];

describe('DecodingRule.Multibyte unit test', function() {
  it('test()', function() {
    var buffer = new Uint8Array([0x82, 0x35, 0xA0, 0x38]);
    var rule = new decodingrule.Multibyte(rules);
    expect(rule.test(buffer)).toBe(1);
  });

  it('decode() - case1', function() {
    var buffer = new Uint8Array([0x82, 0x35, 0xA0, 0x38]);
    var rule = new decodingrule.Multibyte(rules);
    var uint32Array = rule.decode(buffer);
    expect(uint32Array instanceof Uint32Array).toBe(true);
    expect(uint32Array.length).toBe(1);
    expect(uint32Array[0]).toBe(0x8235A038);
  });

  it('decode() - case2', function() {
    var buffer = new Uint8Array([0x20, 0x81, 0x40, 0x82, 0x35, 0xA0, 0x38]);
    var rule = new decodingrule.Multibyte(rules);
    var uint32Array = rule.decode(buffer);
    expect(uint32Array instanceof Uint32Array).toBe(true);
    expect(uint32Array.length).toBe(3);
    expect(uint32Array[0]).toBe(0x20);
    expect(uint32Array[1]).toBe(0x8140);
    expect(uint32Array[2]).toBe(0x8235A038);
  });

  it('parse()', function() {
    var buffer = [0x82, 0x35, 0xA0, 0x38];
    var rule = new decodingrule.Multibyte(rules);
    var array = rule.parse(buffer);
    expect(array instanceof Array).toBe(true);
    expect(array.length).toBe(1);
    expect(array[0]).toBe(0x8235A038);
  });
});

describe('DecodingRule.UTF16LE unit test', function() {
  it('test()', function() {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    expect(decodingrule.UTF16LE.test(buffer)).toBe(1);
  });

  it('decode()', function() {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    var uint32Array = decodingrule.UTF16LE.decode(buffer);
    expect(uint32Array instanceof Uint32Array).toBe(true);
    expect(uint32Array.length).toBe(1);
    expect(uint32Array[0]).toBe(0x1D306);
  });

  it('parse()', function() {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    var array = decodingrule.UTF16LE.parse(buffer);
    expect(array instanceof Array).toBe(true);
    expect(array.length).toBe(1);
    expect(array[0]).toBe(0x1D306);
  });
});

describe('DecodingRule.UTF16BE unit test', function() {
  it('test()', function() {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    expect(decodingrule.UTF16BE.test(buffer)).toBe(1);
  });

  it('decode()', function() {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    var uint32Array = decodingrule.UTF16BE.decode(buffer);
    expect(uint32Array instanceof Uint32Array).toBe(true);
    expect(uint32Array.length).toBe(1);
    expect(uint32Array[0]).toBe(0x1D306);
  });

  it('parse()', function() {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    var array = decodingrule.UTF16BE.parse(buffer);
    expect(array instanceof Array).toBe(true);
    expect(array.length).toBe(1);
    expect(array[0]).toBe(0x1D306);
  });
});

describe('DecodingRule.UTF8 unit test', function() {
  it('test()', function() {
    var buffer = new Uint8Array([0xF0, 0x9D, 0x8C, 0x86]);
    expect(decodingrule.UTF8.test(buffer)).toBe(1);
  });

  it('decode()', function() {
    var buffer = new Uint8Array([0xF0, 0x9D, 0x8C, 0x86]);
    var uint32Array = decodingrule.UTF8.decode(buffer);
    expect(uint32Array instanceof Uint32Array).toBe(true);
    expect(uint32Array.length).toBe(1);
    expect(uint32Array[0]).toBe(0x1D306);
  });

  it('parse()', function() {
    var buffer = new Uint8Array([0xF0, 0x9D, 0x8C, 0x86]);
    var array = decodingrule.UTF8.parse(buffer);
    expect(array instanceof Array).toBe(true);
    expect(array.length).toBe(1);
    expect(array[0]).toBe(0x1D306);
  });
});
