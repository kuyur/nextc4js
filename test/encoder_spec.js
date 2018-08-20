var fs = require('fs');
var encoder = require('../lib/nextc4js/encoder');
var decoder = require('../lib/nextc4js/decoder');
var test = require('tape');

if (!fs.existsSync('test/out')) {
  fs.mkdirSync('test/out');
}

test('UTF16LE encoder unit test', function(t) {
  t.test('convert()', function(assert) {
    var ts = new Date;
    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/bungakusyoujyo-unicode.txt');
    var unicodeBuffer = decoder.UTF16LE.convert(utf16TextBuffer);
    assert.equal(unicodeBuffer != null, true);
    var utf16Buffer = encoder.UTF16LE.convert(unicodeBuffer);
    fs.writeFileSync('test/out/bungakusyoujyo-utf-16le.txt', utf16Buffer, {flag: 'w+'});
    console.log('Consumed time: ' + (new Date - ts) + 'ms');
    assert.end();
  });
});

test('UTF16BE encoder unit test', function(t) {
  t.test('convert()', function(assert) {
    var ts = new Date;
    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/bungakusyoujyo-unicode.txt');
    var unicodeBuffer = decoder.UTF16LE.convert(utf16TextBuffer);
    assert.equal(unicodeBuffer != null, true);
    var utf16Buffer = encoder.UTF16BE.convert(unicodeBuffer);
    fs.writeFileSync('test/out/bungakusyoujyo-utf-16be.txt', utf16Buffer, {flag: 'w+'});
    console.log('Consumed time: ' + (new Date - ts) + 'ms');
    assert.end();
  });
});

test('UTF8 encoder unit test', function(t) {
  t.test('convert()', function(assert) {
    var ts = new Date;
    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/bungakusyoujyo-unicode-orig.txt');
    var unicodeBuffer = decoder.UTF16LE.convert(utf16TextBuffer);
    assert.equal(unicodeBuffer != null, true);
    var utf8Buffer = encoder.UTF8.convert(unicodeBuffer);
    fs.writeFileSync('test/out/bungakusyoujyo-utf-8-orig.txt', utf8Buffer, {flag: 'w+'});
    console.log('Consumed time: ' + (new Date - ts) + 'ms');
    assert.end();
  });
});