var decodingrule = require('../lib/decoding-rule');
var goog = require('../lib/goog-base');

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
    var rule = new decodingrule.Multibyte(rules, [{
      begin: 0x00,
      end: 0xE339FE39,
      reference: 'self'
    }]);
    var uint32Array = rule.decode(buffer);
    expect(uint32Array instanceof Uint32Array).toBe(true);
    expect(uint32Array.length).toBe(1);
    expect(uint32Array[0]).toBe(0x8235A038);
  });

  it('decode() - case2', function() {
    var buffer = new Uint8Array([0x20, 0x81, 0x40, 0x82, 0x35, 0xA0, 0x38]);
    var rule = new decodingrule.Multibyte(rules, [{
      begin: 0x00,
      end: 0xE339FE39,
      reference: 'self'
    }]);
    var uint32Array = rule.decode(buffer);
    expect(uint32Array instanceof Uint32Array).toBe(true);
    expect(uint32Array.length).toBe(3);
    expect(uint32Array[0]).toBe(0x20);
    expect(uint32Array[1]).toBe(0x8140);
    expect(uint32Array[2]).toBe(0x8235A038);
  });

  it('parse()', function() {
    var buffer = [0x20, 0x21];
    var rule = new decodingrule.Multibyte(rules, [{
      begin: 0x00,
      end: 0xFF,
      reference: 'self'
    }]);
    var str = rule.parse(buffer);
    expect(goog.isString(str)).toBe(true);
    expect(str.length).toBe(2);
    expect(str.codePointAt(0)).toBe(0x20);
    expect(str.codePointAt(1)).toBe(0x21);
  });
});

describe('DecodingRule.UTF16LE unit test', function() {
  it('test()', function() {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    expect(decodingrule.UTF16LE.test(buffer)).toBe(1);
    expect(decodingrule.UTF16LE.test(buffer, 4)).toBe(0);

    expect(decodingrule.UTF16LE.test(null)).toBe(-1);

    var buffer2 = new Uint8Array(0);
    expect(decodingrule.UTF16LE.test(buffer2)).toBe(0);

    var buffer3 = new Uint8Array([0x34, 0xD8, 0x06]);
    expect(decodingrule.UTF16LE.test(buffer3)).toBe(-1);

    // invalid byte order
    var buffer4 = new Uint8Array([0x06, 0xDF, 0x34, 0xD8]);
    expect(decodingrule.UTF16LE.test(buffer4)).toBe(-1);
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
    var str = decodingrule.UTF16LE.parse(buffer);
    expect(goog.isString(str)).toBe(true);
    expect(str.length).toBe(2);
    expect(str.codePointAt(0)).toBe(0x1D306);

    var buffer2 = new Uint8Array([0x00, 0x34, 0xD8, 0x06, 0xDF]);
    var str2 = decodingrule.UTF16LE.parse(buffer2, 1);
    expect(goog.isString(str2)).toBe(true);
    expect(str2.length).toBe(2);
    expect(str2.codePointAt(0)).toBe(0x1D306);

    expect(decodingrule.UTF16LE.parse(buffer2, 4)).toBe('');
    expect(decodingrule.UTF16LE.parse(buffer2, 5)).toEqual('');
  });
});

describe('DecodingRule.UTF16BE unit test', function() {
  it('test()', function() {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    expect(decodingrule.UTF16BE.test(buffer)).toBe(1);
    expect(decodingrule.UTF16BE.test(buffer, 4)).toBe(0);

    expect(decodingrule.UTF16BE.test(null)).toBe(-1);

    var buffer2 = new Uint8Array(0);
    expect(decodingrule.UTF16BE.test(buffer2)).toBe(0);

    var buffer3 = new Uint8Array([0xD8, 0x34, 0xDF]);
    expect(decodingrule.UTF16BE.test(buffer3)).toBe(-1);

    // invalid byte order
    var buffer4 = new Uint8Array([0xDF, 0x06, 0xD8, 0x34]);
    expect(decodingrule.UTF16BE.test(buffer4)).toBe(-1);
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
    var str = decodingrule.UTF16BE.parse(buffer);
    expect(goog.isString(str)).toBe(true);
    expect(str.length).toBe(2);
    expect(str.codePointAt(0)).toBe(0x1D306);

    var buffer2 = new Uint8Array([0x00, 0xD8, 0x34, 0xDF, 0x06]);
    var str2 = decodingrule.UTF16BE.parse(buffer2, 1);
    expect(goog.isString(str2)).toBe(true);
    expect(str2.length).toBe(2);
    expect(str2.codePointAt(0)).toBe(0x1D306);

    expect(decodingrule.UTF16BE.parse(buffer2, 4)).toBe('');
    expect(decodingrule.UTF16BE.parse(buffer2, 5)).toEqual('');
  });
});

describe('DecodingRule.UTF8 unit test', function() {
  it('test()', function() {
    var buffer = new Uint8Array([0xF0, 0x9D, 0x8C, 0x86]);
    expect(decodingrule.UTF8.test(buffer)).toBe(1);
  });

  it('decode()', function() {
    expect(decodingrule.UTF8.decode(null)).toBe(null);
    expect(decodingrule.UTF8.decode(new Uint8Array(0)).length).toBe(0);

    var buffer = new Uint8Array([0xF0, 0x9D, 0x8C, 0x86]);
    var uint32Array = decodingrule.UTF8.decode(buffer);
    expect(uint32Array instanceof Uint32Array).toBe(true);
    expect(uint32Array.length).toBe(1);
    expect(uint32Array[0]).toBe(0x1D306);

    var buffer_1 = new Uint8Array([0x00, 0xF0, 0x9D, 0x8C, 0x86]);
    var uint32Array_1 = decodingrule.UTF8.decode(buffer_1, 1);
    expect(uint32Array_1 instanceof Uint32Array).toBe(true);
    expect(uint32Array_1.length).toBe(1);
    expect(uint32Array_1[0]).toBe(0x1D306);

    var buffer2 = new Uint8Array([0xF9, 0x81, 0x81, 0x81, 0x81]);
    var uint32Array2 = decodingrule.UTF8.decode(buffer2);
    expect(uint32Array2 instanceof Uint32Array).toBe(true);
    expect(uint32Array2.length).toBe(1);
    expect(uint32Array2[0]).toBe(0x1041041);

    var buffer3 = new Uint8Array([0xFB, 0xBF, 0xBF, 0xBF, 0xBF]);
    var uint32Array3 = decodingrule.UTF8.decode(buffer3);
    expect(uint32Array3 instanceof Uint32Array).toBe(true);
    expect(uint32Array3.length).toBe(1);
    expect(uint32Array3[0]).toBe(0x3FFFFFF);

    var buffer4 = new Uint8Array([0xFD, 0xBF, 0xBF, 0xBF, 0xBF, 0xBF]);
    var uint32Array4 = decodingrule.UTF8.decode(buffer4);
    expect(uint32Array4 instanceof Uint32Array).toBe(true);
    expect(uint32Array4.length).toBe(1);
    expect(uint32Array4[0]).toBe(0x7FFFFFFF);
  });

  it('parse()', function() {
    expect(decodingrule.UTF8.parse(new Uint8Array(0))).toEqual('');

    var buffer = new Uint8Array([0x20, 0xDF, 0xBF, 0xE7, 0x9C, 0x8B, 0xF0, 0x9D, 0x8C, 0x86]);
    var str = decodingrule.UTF8.parse(buffer);
    expect(goog.isString(str)).toBe(true);
    expect(str.length).toBe(5);
    expect(str.codePointAt(0)).toBe(0x20);
    expect(str.codePointAt(1)).toBe(0x7FF);
    expect(str.codePointAt(2)).toBe(0x770B);
    expect(str.codePointAt(3)).toBe(0x1D306);
  });
});
