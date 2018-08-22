var decodingrule = require('../lib/nextc4js/decoding-rule');
var test = require('tape');

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

test('DecodingRule.Multibyte unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint8Array([0x82, 0x35, 0xA0, 0x38]);
    var rule = new decodingrule.Multibyte(rules);
    assert.equal(rule.test(buffer), 1);
    assert.end();
  });

  t.test('decode() - case1', function(assert) {
    var buffer = new Uint8Array([0x82, 0x35, 0xA0, 0x38]);
    var rule = new decodingrule.Multibyte(rules);
    var uint32Array = rule.decode(buffer);
    assert.equal(uint32Array instanceof Uint32Array, true);
    assert.equal(uint32Array.length, 1);
    assert.equal(uint32Array[0], 0x8235A038);
    assert.end();
  });

  t.test('decode() - case2', function(assert) {
    var buffer = new Uint8Array([0x20, 0x81, 0x40, 0x82, 0x35, 0xA0, 0x38]);
    var rule = new decodingrule.Multibyte(rules);
    var uint32Array = rule.decode(buffer);
    assert.equal(uint32Array instanceof Uint32Array, true);
    assert.equal(uint32Array.length, 3);
    assert.equal(uint32Array[0], 0x20);
    assert.equal(uint32Array[1], 0x8140);
    assert.equal(uint32Array[2], 0x8235A038);
    assert.end();
  });

  t.test('parse()', function(assert) {
    var buffer = [0x82, 0x35, 0xA0, 0x38];
    var rule = new decodingrule.Multibyte(rules);
    var array = rule.parse(buffer);
    assert.equal(array instanceof Array, true);
    assert.equal(array.length, 1);
    assert.equal(array[0], 0x8235A038);
    assert.end();
  });
});

test('DecodingRule.UTF16LE unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    assert.equal(decodingrule.UTF16LE.test(buffer), 1);
    assert.end();
  });

  t.test('decode()', function(assert) {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    var uint32Array = decodingrule.UTF16LE.decode(buffer);
    assert.equal(uint32Array instanceof Uint32Array, true);
    assert.equal(uint32Array.length, 1);
    assert.equal(uint32Array[0], 0x1D306);
    assert.end();
  });

  t.test('parse()', function(assert) {
    var buffer = new Uint8Array([0x34, 0xD8, 0x06, 0xDF]);
    var array = decodingrule.UTF16LE.parse(buffer);
    assert.equal(array instanceof Array, true);
    assert.equal(array.length, 1);
    assert.equal(array[0], 0x1D306);
    assert.end();
  });
});

test('DecodingRule.UTF16BE unit test', function(t) {
  t.test('test()', function(assert) {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    assert.equal(decodingrule.UTF16BE.test(buffer), 1);
    assert.end();
  });

  t.test('decode()', function(assert) {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    var uint32Array = decodingrule.UTF16BE.decode(buffer);
    assert.equal(uint32Array instanceof Uint32Array, true);
    assert.equal(uint32Array.length, 1);
    assert.equal(uint32Array[0], 0x1D306);
    assert.end();
  });

  t.test('parse()', function(assert) {
    var buffer = new Uint8Array([0xD8, 0x34, 0xDF, 0x06]);
    var array = decodingrule.UTF16BE.parse(buffer);
    assert.equal(array instanceof Array, true);
    assert.equal(array.length, 1);
    assert.equal(array[0], 0x1D306);
    assert.end();
  });
});

test('DecodingRule.UTF8 unit test', function(t) {
    t.test('test()', function(assert) {
      var buffer = new Uint8Array([0xF0, 0x9D, 0x8C, 0x86]);
      assert.equal(decodingrule.UTF8.test(buffer), 1);
      assert.end();
    });
  
    t.test('decode()', function(assert) {
      var buffer = new Uint8Array([0xF0, 0x9D, 0x8C, 0x86]);
      var uint32Array = decodingrule.UTF8.decode(buffer);
      assert.equal(uint32Array instanceof Uint32Array, true);
      assert.equal(uint32Array.length, 1);
      assert.equal(uint32Array[0], 0x1D306);
      assert.end();
    });
  
    t.test('parse()', function(assert) {
      var buffer = new Uint8Array([0xF0, 0x9D, 0x8C, 0x86]);
      var array = decodingrule.UTF8.parse(buffer);
      assert.equal(array instanceof Array, true);
      assert.equal(array.length, 1);
      assert.equal(array[0], 0x1D306);
      assert.end();
    });
});
