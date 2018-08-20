var encodingrule = require('../lib/nextc4js/encoding-rule');
var test = require('tape');

test('EncodingRule.UTF16LE unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    assert.equal(encodingrule.UTF16LE.test(buffer), 4);
    assert.end();
  });

  t.test('encode()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    var uint8array = encodingrule.UTF16LE.encode(buffer);
    assert.equal(uint8array instanceof Uint8Array, true);
    assert.equal(uint8array.length, 4);
    assert.equal(uint8array[0], 0x34);
    assert.equal(uint8array[1], 0xD8);
    assert.equal(uint8array[2], 0x06);
    assert.equal(uint8array[3], 0xDF);
    assert.end();
  });
});

test('EncodingRule.UTF16BE unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    assert.equal(encodingrule.UTF16BE.test(buffer), 4);
    assert.end();
  });

  t.test('encode()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    var uint8array = encodingrule.UTF16BE.encode(buffer);
    assert.equal(uint8array instanceof Uint8Array, true);
    assert.equal(uint8array.length, 4);
    assert.equal(uint8array[0], 0xD8);
    assert.equal(uint8array[1], 0x34);
    assert.equal(uint8array[2], 0xDF);
    assert.equal(uint8array[3], 0x06);
    assert.end();
  });
});

test('EncodingRule.UTF8 unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    assert.equal(encodingrule.UTF8.test(buffer), 4);
    assert.end();
  });

  t.test('encode()', function(assert) {
    var buffer = new Uint32Array([0x1D306]);
    var uint8array = encodingrule.UTF8.encode(buffer);
    assert.equal(uint8array instanceof Uint8Array, true);
    assert.equal(uint8array.length, 4);
    assert.equal(uint8array[0], 0xF0);
    assert.equal(uint8array[1], 0x9D);
    assert.equal(uint8array[2], 0x8C);
    assert.equal(uint8array[3], 0x86);
    assert.end();
  });
});
