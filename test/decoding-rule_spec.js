var DecodingRuleMultibyte = require('../lib/nextc4js/decoding-rule.js').DecodingRuleMultibyte;
var DECODING_RULE_UTF16LE = require('../lib/nextc4js/decoding-rule.js').DECODING_RULE_UTF16LE;
var DECODING_RULE_UTF16BE = require('../lib/nextc4js/decoding-rule.js').DECODING_RULE_UTF16BE;
var DECODING_RULE_UTF8 = require('../lib/nextc4js/decoding-rule.js').DECODING_RULE_UTF8;
var test = require('tape');

var rules = [
  {
    "byte": 1,
    "condition": ["0x00~0x80"]
  }, {
    "byte": 1,
    "condition": ["0xFF"]
  }, {
    "byte": 2,
    "condition": ["0x81~0xFE", "0x40~0xFE"]
  }, {
    "byte": 4,
    "condition": ["0x81~0xFE", "0x30~0x39", "0x81~0xFE", "0x30~0x39"]
  }
];

test('DecodingRuleMultibyte unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint8Array([0x82, 0x35, 0xA0, 0x38]);
    var decodingRule = new DecodingRuleMultibyte(rules);
    assert.equal(decodingRule.test(buffer), 1);
    assert.end();
  });

  t.test('decode()', function(assert) {
    var buffer = new Uint8Array([0x82, 0x35, 0xA0, 0x38]);
    var decodingRule = new DecodingRuleMultibyte(rules);
    var uint32Array = decodingRule.decode(buffer);
    assert.equal(uint32Array instanceof Uint32Array, true);
    assert.equal(uint32Array.length, 1);
    assert.equal(uint32Array[0], 0x8235A038);
    assert.end();
  });

  t.test('decode()', function(assert) {
    var buffer = new Uint8Array([0x20, 0x81, 0x40, 0x82, 0x35, 0xA0, 0x38]);
    var decodingRule = new DecodingRuleMultibyte(rules);
    var uint32Array = decodingRule.decode(buffer);
    assert.equal(uint32Array instanceof Uint32Array, true);
    assert.equal(uint32Array.length, 3);
    assert.equal(uint32Array[0], 0x20);
    assert.equal(uint32Array[1], 0x8140);
    assert.equal(uint32Array[2], 0x8235A038);
    assert.end();
  });

  t.test('parse()', function(assert) {
    var buffer = new Uint8Array([0x82, 0x35, 0xA0, 0x38]);
    var decodingRule = new DecodingRuleMultibyte(rules);
    var array = decodingRule.parse(buffer);
    assert.equal(array instanceof Array, true);
    assert.equal(array.length, 1);
    assert.equal(array[0], 0x8235A038);
    assert.end();
  });
});

test('DecodingRuleUTF16LE unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    var utf16le = DECODING_RULE_UTF16LE;
    assert.equal(utf16le.test(buffer), 1);
    assert.end();
  });

  t.test('decode()', function(assert) {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    var utf16le = DECODING_RULE_UTF16LE;
    var uint32Array = utf16le.decode(buffer);
    assert.equal(uint32Array instanceof Uint32Array, true);
    assert.equal(uint32Array.length, 1);
    assert.equal(uint32Array[0], 0x1D306);
    assert.end();
  });

  t.test('parse()', function(assert) {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    var utf16le = DECODING_RULE_UTF16LE;
    var array = utf16le.parse(buffer);
    assert.equal(array instanceof Array, true);
    assert.equal(array.length, 1);
    assert.equal(array[0], 0x1D306);
    assert.end();
  });
});

test('DecodingRuleUTF16BE unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    var utf16be = DECODING_RULE_UTF16BE;
    assert.equal(utf16be.test(buffer), 1);
    assert.end();
  });

  t.test('decode()', function(assert) {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    var utf16be = DECODING_RULE_UTF16BE;
    var uint32Array = utf16be.decode(buffer);
    assert.equal(uint32Array instanceof Uint32Array, true);
    assert.equal(uint32Array.length, 1);
    assert.equal(uint32Array[0], 0x1D306);
    assert.end();
  });

  t.test('parse()', function(assert) {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    var utf16be = DECODING_RULE_UTF16BE;
    var array = utf16be.parse(buffer);
    assert.equal(array instanceof Array, true);
    assert.equal(array.length, 1);
    assert.equal(array[0], 0x1D306);
    assert.end();
  });
});

test('DecodingRuleUTF8 unit test', function(t) {
    t.test('test()', function(assert) {
      var buffer = new Uint8Array([0xF0, 0x9D, 0x8C, 0x86]);
      var utf8 = DECODING_RULE_UTF8;
      assert.equal(utf8.test(buffer), 1);
      assert.end();
    });
  
    t.test('decode()', function(assert) {
      var buffer = new Uint8Array([0xF0, 0x9D, 0x8C, 0x86]);
      var utf8 = DECODING_RULE_UTF8;
      var uint32Array = utf8.decode(buffer);
      assert.equal(uint32Array instanceof Uint32Array, true);
      assert.equal(uint32Array.length, 1);
      assert.equal(uint32Array[0], 0x1D306);
      assert.end();
    });
  
    t.test('parse()', function(assert) {
      var buffer = new Uint8Array([0xF0, 0x9D, 0x8C, 0x86]);
      var utf8 = DECODING_RULE_UTF8;
      var array = utf8.parse(buffer);
      assert.equal(array instanceof Array, true);
      assert.equal(array.length, 1);
      assert.equal(array[0], 0x1D306);
      assert.end();
    });
});
