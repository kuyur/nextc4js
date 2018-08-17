var fs = require('fs');
var MultiByteCharmap = require('../lib/nextc4js/charmap.js').Multibyte;
var CHARMAP_DECODE_UTF16LE = require('../lib/nextc4js/charmap.js').UTF16LE;
var ENCODING_RULE_UTF8 = require('../lib/nextc4js/encoding-rule.js').ENCODING_RULE_UTF8;
var test = require('tape');

var options = {
  "name": "gbk-front-end",
  "description": "GBK to Unicode.",
  "version": "CP936 with enhancement",
  "type": "front-end",
  "path": "charmaps/front-gb2u-little-endian.map",
  "rules": [
    {
      "byte": 1,
      "condition": ["0x00~0x80"]
    }, {
      "byte": 2,
      "condition": ["0x81~0xFE", "0x40~0xFE"]
    }
  ],
  "segments": [{
    "begin": 0,
    "end": 127,
    "reference": "ascii",
    "characterset": "ascii"
  }, {
    "begin": 128,
    "end": 128,
    "reference": "buffer",
    "offset": 0,
    "characterset": "Euro Sign"
  }, {
    "begin": 129,
    "end": 33087,
    "reference": "undefined",
    "characterset": "undefined"
  }, {
    "begin": 33088,
    "end": 65535,
    "reference": "buffer",
    "offset": 1,
    "characterset": "GBK"
  }]
};

var charmap = fs.readFileSync(options.path);

test('GBK Charmap unit test', function(t) {
  t.test('convert()', function(assert) {
    var gbkTextBuffer = fs.readFileSync('test/txt/gbk/02-gbk.txt');
    var gbkCharmap = new MultiByteCharmap(options, new Uint16Array(charmap.buffer));
    var unicodeBuffer = gbkCharmap.convert(gbkTextBuffer);
    assert.equal(unicodeBuffer != null, true);
    var unicodeString = '';
    unicodeBuffer.forEach(function(code) {
      unicodeString += String.fromCodePoint(code);
    })
    assert.equal(unicodeString, '任何读过黑塞作品的人，都会为黑塞作品中的人生阅历与感悟，以及浪漫气息所打动，情不自禁回忆起自己的青年时代。青年没能在青年时代阅读黑塞，是一个极大的损失，尽管成年之后，重读时，会感受到这种懊悔，这就是一位只要有过阅读，就一定会喜欢上的作家，一个性情中人，坦率的朋友，人生的导师。');
    assert.end();
  });
});

test('UTF16 Charmap unit test', function(t) {
  t.test('convert() - performance', function(assert) {
    var ts = new Date;
    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/bungakusyoujyo-unicode.txt');
    var unicodeBuffer = CHARMAP_DECODE_UTF16LE.convert(utf16TextBuffer);
    assert.equal(unicodeBuffer != null, true);
    var utf8Buffer = ENCODING_RULE_UTF8.encode(unicodeBuffer);
    fs.writeFileSync('test/out/bungakusyoujyo-utf-8.txt', utf8Buffer, {flag: 'w+'});
    console.log('Consumed time: ' + (new Date - ts) + 'ms');
    assert.end();
  });
});
