var ENCODING_RULE_UTF16LE = require('../lib/nextc4js/encoding-rule.js').ENCODING_RULE_UTF16LE;
var ENCODING_RULE_UTF16BE = require('../lib/nextc4js/encoding-rule.js').ENCODING_RULE_UTF16BE;
var ENCODING_RULE_UTF8 = require('../lib/nextc4js/encoding-rule.js').ENCODING_RULE_UTF8;
var test = require('tape');

test('EncodingRuleUTF16LE unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    var utf16le = ENCODING_RULE_UTF16LE;
    assert.equal(utf16le.test(buffer), 4);
    assert.end();
  });

  t.test('encode()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    var utf16le = ENCODING_RULE_UTF16LE;
    var uint8array = utf16le.encode(buffer);
    assert.equal(uint8array instanceof Uint8Array, true);
    assert.equal(uint8array.length, 4);
    assert.equal(uint8array[0], 0x34);
    assert.equal(uint8array[1], 0xD8);
    assert.equal(uint8array[2], 0x06);
    assert.equal(uint8array[3], 0xDF);
    assert.end();
  });
});

test('EncodingRuleUTF16BE unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    var utf16be = ENCODING_RULE_UTF16BE;
    assert.equal(utf16be.test(buffer), 4);
    assert.end();
  });

  t.test('encode()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    var utf16be = ENCODING_RULE_UTF16BE;
    var uint8array = utf16be.encode(buffer);
    assert.equal(uint8array instanceof Uint8Array, true);
    assert.equal(uint8array.length, 4);
    assert.equal(uint8array[0], 0xD8);
    assert.equal(uint8array[1], 0x34);
    assert.equal(uint8array[2], 0xDF);
    assert.equal(uint8array[3], 0x06);
    assert.end();
  });
});

test('EncodingRuleUTF8 unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    var utf8 = ENCODING_RULE_UTF8;
    assert.equal(utf8.test(buffer), 4);
    assert.end();
  });

  t.test('encode()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    var utf8 = ENCODING_RULE_UTF8;
    var uint8array = utf8.encode(buffer);
    assert.equal(uint8array instanceof Uint8Array, true);
    assert.equal(uint8array.length, 4);
    assert.equal(uint8array[0], 0xF0);
    assert.equal(uint8array[1], 0x9D);
    assert.equal(uint8array[2], 0x8C);
    assert.equal(uint8array[3], 0x86);
    assert.end();
  });
});
