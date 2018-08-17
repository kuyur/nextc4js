var Condition = require('../lib/nextc4js/condition.js').Condition;
var bufferutils = require('../lib/nextc4js/buffer-utils.js').bufferutils;
var test = require('tape');

var option = ["0x81~0x84", "0x30~0x39", "0x81~0xFE", "0x30~0x39"];

test('Condition unit test', function(t) {
  t.test('getIndexingOffset() - case1', function(assert) {
    var buffer = new Uint8Array([0x81, 0x30, 0x81, 0x30]);
    var chr = bufferutils.readUInt32BE(buffer, 0, 4);
    var condition = Condition.build(option);
    assert.equal(condition.getIndexingOffset(chr), 0);
    assert.end();
  });

  t.test('getIndexingOffset() - case2', function(assert) {
    var buffer = new Uint8Array([0x84, 0x39, 0xFE, 0x39]);
    var chr = bufferutils.readUInt32BE(buffer, 0, 4);
    var condition = Condition.build(option);
    assert.equal(condition.getIndexingOffset(chr), 50399);
    assert.end();
  });

  t.test('getIndexingOffset() - case3', function(assert) {
    var buffer = new Uint8Array([0x81, 0x30, 0x40, 0x30]);
    var chr = bufferutils.readUInt32BE(buffer, 0, 4);
    var condition = Condition.build(option);
    assert.equal(condition.getIndexingOffset(chr), -1);
    assert.end();
  });
});
