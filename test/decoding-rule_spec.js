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

  t.test('parse()', function(assert) {
    var buffer = new Uint8Array([0x82, 0x35, 0xA0, 0x38]);
    var decodingRule = new DecodingRuleMultibyte(rules);
    var uint32Array = decodingRule.parse(buffer);
    assert.equal(uint32Array instanceof Uint32Array, true);
    assert.equal(uint32Array.length, 1);
    assert.equal(uint32Array[0], 2184552504);
    assert.end();
  });

  t.test('parse2()', function(assert) {
    var buffer = new Uint8Array([0x82, 0x35, 0xA0, 0x38]);
    var decodingRule = new DecodingRuleMultibyte(rules);
    var array = decodingRule.parse2(buffer);
    assert.equal(array instanceof Array, true);
    assert.equal(array.length, 1);
    assert.equal(array[0], 2184552504);
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

  t.test('parse()', function(assert) {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    var utf16le = DECODING_RULE_UTF16LE;
    var uint32Array = utf16le.parse(buffer);
    assert.equal(uint32Array instanceof Uint32Array, true);
    assert.equal(uint32Array.length, 1);
    assert.equal(uint32Array[0], 0x1d306);
    assert.end();
  });

  t.test('parse2()', function(assert) {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    var utf16le = DECODING_RULE_UTF16LE;
    var array = utf16le.parse2(buffer);
    assert.equal(array instanceof Array, true);
    assert.equal(array.length, 1);
    assert.equal(array[0], 0x1d306);
    assert.end();
  });
});

test('DecodingRuleUTF16BE unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    var utf16le = DECODING_RULE_UTF16BE;
    assert.equal(utf16le.test(buffer), 1);
    assert.end();
  });

  t.test('parse()', function(assert) {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    var utf16le = DECODING_RULE_UTF16BE;
    var uint32Array = utf16le.parse(buffer);
    assert.equal(uint32Array instanceof Uint32Array, true);
    assert.equal(uint32Array.length, 1);
    assert.equal(uint32Array[0], 0x1d306);
    assert.end();
  });

  t.test('parse2()', function(assert) {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    var utf16le = DECODING_RULE_UTF16BE;
    var array = utf16le.parse2(buffer);
    assert.equal(array instanceof Array, true);
    assert.equal(array.length, 1);
    assert.equal(array[0], 0x1d306);
    assert.end();
  });
});
