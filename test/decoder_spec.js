var fs = require('fs');
var decoder = require('../lib/nextc4js/decoder');
var encodingrule = require('../lib/nextc4js/encoding-rule');
var consts = require('../lib/nextc4js/const');
var test = require('tape');

var gbkOptions = {
  "name": "gbk-front-end",
  "description": "GBK to Unicode.",
  "version": "CP936 with enhancement",
  "type": "front-end",
  "path": "charmaps/front-gbk2u-little-endian.map",
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

var big5Options = {
  "name": "big5-front-end",
  "description": "Big5 to Unicode.",
  "version": "UAO 2.50",
  "type": "front-end",
  "path": "charmaps/front-b2u-little-endian.map",
  "rules": [
    {
      "byte": 1,
      "condition": ["0x00~0x7F"]
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
    "end": 33087,
    "reference": "undefined",
    "characterset": "undefined"
  }, {
    "begin": 33088,
    "end": 65535,
    "reference": "buffer",
    "offset": 0,
    "characterset": "BIG5 UAO 2.50"
  }]
};

if (!fs.existsSync('test/out')) {
  fs.mkdirSync('test/out');
}

test('GBK Decoder unit test', function(t) {
  t.test('decode()', function(assert) {
    var charmap = fs.readFileSync(gbkOptions.path);
    var gbkTextBuffer = fs.readFileSync('test/txt/gbk/02-gbk.txt');
    var gbkDecoder = new decoder.Multibyte(gbkOptions, new Uint16Array(charmap.buffer));
    var unicodeBuffer = gbkDecoder.decode(gbkTextBuffer);
    assert.equal(unicodeBuffer != null, true);
    var unicodeString = '';
    unicodeBuffer.forEach(function(code) {
      unicodeString += String.fromCodePoint(code);
    })
    assert.equal(unicodeString, '任何读过黑塞作品的人，都会为黑塞作品中的人生阅历与感悟，以及浪漫气息所打动，情不自禁回忆起自己的青年时代。青年没能在青年时代阅读黑塞，是一个极大的损失，尽管成年之后，重读时，会感受到这种懊悔，这就是一位只要有过阅读，就一定会喜欢上的作家，一个性情中人，坦率的朋友，人生的导师。');
    assert.end();
  });
});

test('Big5 Decoder unit test', function(t) {
  t.test('decode()', function(assert) {
    var charmap = fs.readFileSync(big5Options.path);
    var big5TextBuffer = fs.readFileSync('test/txt/big5/02-big5.cue');
    var big5Decoder = new decoder.Multibyte(big5Options, new Uint16Array(charmap.buffer));
    var unicodeBuffer = big5Decoder.decode(big5TextBuffer);
    assert.equal(unicodeBuffer != null, true);
    var utf8Buffer = encodingrule.UTF8.encode(unicodeBuffer);
    fs.open('test/out/hatsukiyura-utf-8.cue', 'w+', function(err, fd) {
      fs.writeSync(fd, consts.UTF8_BOM, 0, consts.UTF8_BOM.length, 0);
      fs.writeSync(fd, utf8Buffer, 0, utf8Buffer.length, consts.UTF8_BOM.length);
      fs.closeSync(fd);
    });
    assert.end();
  });
});

test('UTF16LE Decoder unit test', function(t) {
  t.test('decode() - performance', function(assert) {
    var ts = new Date;
    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/bungakusyoujyo-unicode.txt');
    var unicodeBuffer = decoder.UTF16LE.decode(utf16TextBuffer);
    assert.equal(unicodeBuffer != null, true);
    var utf8Buffer = encodingrule.UTF8.encode(unicodeBuffer);
    fs.writeFileSync('test/out/bungakusyoujyo-utf-8.txt', utf8Buffer, {flag: 'w+'});
    console.log('Consumed time: ' + (new Date - ts) + 'ms');
    assert.end();
  });
});
