var fs = require('fs');
var decoder = require('../lib/decoder');
var encodingrule = require('../lib/encoding-rule');
var consts = require('../lib/consts');
var bufferutils = require('../lib/buffer-utils');
const { CharmapType } = require('../lib/charmap');
var goog = require('../lib/goog-base');

var shiftJisOption = {
  'name': 'Shift-JIS(CP932)',
  'description': 'Shift-JIS to Unicode.',
  'version': 'CP932',
  'type': 'decoder',
  'buffer': 'charmaps/front-jis2u-little-endian.map',
  'byte': 2,
  'rules': [
    {
      'condition': [
        '0x00~0x7F'
      ]
    },
    {
      'condition': [
        '0xA1~0xDF'
      ]
    },
    {
      'condition': [
        '0x81~0x9F',
        '0x40~0xFC'
      ]
    },
    {
      'condition': [
        '0xE0~0xFC',
        '0x40~0xFC'
      ]
    }
  ],
  'segments': [
    {
      'begin': 0,
      'end': 127,
      'reference': 'ascii',
      'characterset': 'ascii'
    },
    {
      'begin': 128,
      'end': 160,
      'reference': 'undefined',
      'characterset': 'undefined'
    },
    {
      'begin': 161,
      'end': 223,
      'reference': 'buffer',
      'offset': 0,
      'characterset': 'JIS-X-0201'
    },
    {
      'begin': 224,
      'end': 33087,
      'reference': 'undefined',
      'characterset': 'undefined'
    },
    {
      'begin': 33088,
      'end': 65535,
      'reference': 'buffer',
      'offset': 63,
      'characterset': 'JIS-X-0208'
    }
  ]
};

var gbkOptions = {
  'name': 'gbk-decoder',
  'description': 'GBK to Unicode.',
  'version': 'CP936 with enhancement',
  'type': 'decoder',
  'buffer': 'charmaps/front-gbk2u-little-endian.map',
  'byte': 2,
  'rules': [
    {
      'byte': 1,
      'condition': ['0x00~0x80']
    }, {
      'byte': 2,
      'condition': ['0x81~0xFE', '0x40~0xFE']
    }
  ],
  'segments': [{
    'begin': 0,
    'end': 127,
    'reference': 'ascii',
    'characterset': 'ascii'
  }, {
    'begin': 128,
    'end': 128,
    'reference': 'buffer',
    'offset': 0,
    'characterset': 'Euro Sign'
  }, {
    'begin': 129,
    'end': 33087,
    'reference': 'undefined',
    'characterset': 'undefined'
  }, {
    'begin': 33088,
    'end': 65535,
    'reference': 'buffer',
    'offset': 1,
    'characterset': 'GBK'
  }]
};

var big5Options = {
  'name': 'big5-decoder',
  'description': 'Big5 to Unicode.',
  'version': 'UAO 2.50',
  'type': 'decoder',
  'buffer': 'charmaps/front-b2u-little-endian.map',
  'byte': 2,
  'rules': [
    {
      'byte': 1,
      'condition': ['0x00~0x7F']
    }, {
      'byte': 2,
      'condition': ['0x81~0xFE', '0x40~0xFE']
    }
  ],
  'segments': [{
    'begin': 0,
    'end': 127,
    'reference': 'ascii',
    'characterset': 'ascii'
  }, {
    'begin': 128,
    'end': 33087,
    'reference': 'undefined',
    'characterset': 'undefined'
  }, {
    'begin': 33088,
    'end': 65535,
    'reference': 'buffer',
    'offset': 0,
    'characterset': 'BIG5 UAO 2.50'
  }]
};

var gb18030Options = {
  'name': 'gb18030-decoder',
  'description': 'GB18030 to Unicode.',
  'version': 'GB18030-2005',
  'type': 'decoder',
  'buffer': 'charmaps/front-gb180302u-little-endian.map',
  'byte': 2,
  'rules': [
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
      'condition': ['0x81~0x84', '0x30~0x39', '0x81~0xFE', '0x30~0x39']
    }, {
      'byte': 4,
      'condition': ['0x90~0xE3', '0x30~0x39', '0x81~0xFE', '0x30~0x39']
    }
  ],
  'segments': [{
    'begin': 0,
    'end': 127,
    'reference': 'ascii',
    'characterset': 'ascii'
  }, {
    'begin': 128,
    'end': 128,
    'reference': 'buffer',
    'offset': 0,
    'characterset': 'Euro Sign'
  }, {
    'begin': 129,
    'end': 33087,
    'reference': 'undefined',
    'characterset': 'undefined'
  }, {
    'begin': 33088,
    'end': 65535,
    'reference': 'buffer',
    'offset': 1,
    'characterset': 'GBK'
  }, {
    'begin': 65536,
    'end': 2167439663,
    'reference': 'undefined',
    'characterset': 'undefined'
  }, {
    'begin': 2167439664,
    'end': 2218393145,
    'condition': ['0x81~0x84', '0x30~0x39', '0x81~0xFE', '0x30~0x39'],
    'reference': 'indexing-buffer',
    'offset': 32449,
    'characterset': 'Unicode (BMP)'
  }, {
    'begin': 2218393146,
    'end': 2419097903,
    'reference': 'undefined',
    'characterset': 'undefined'
  }, {
    'begin': 2419097904,
    'end': 3812228665,
    'condition': ['0x90~0xE3', '0x30~0x39', '0x81~0xFE', '0x30~0x39'],
    'reference': 'gb18030-unicode-sp-mapping',
    'characterset': 'Unicode (SP)'
  }, {
    'begin': 3812228666,
    'end': 4294967295,
    'reference': 'undefined',
    'characterset': 'undefined'
  }]
};

beforeAll(() => {
  if (!fs.existsSync('test/out')) {
    fs.mkdirSync('test/out');
  }

  if (goog.isString(shiftJisOption.buffer)) {
    var buffer0 = fs.readFileSync(shiftJisOption.buffer);
    shiftJisOption.buffer = shiftJisOption.byte === 2 ?
      new Uint16Array(buffer0.buffer) : new Uint32Array(buffer0.buffer);
  }

  if (goog.isString(gbkOptions.buffer)) {
    var buffer1 = fs.readFileSync(gbkOptions.buffer);
    gbkOptions.buffer = gbkOptions.byte === 2 ? new Uint16Array(buffer1.buffer) : new Uint32Array(buffer1.buffer);
  }

  if (goog.isString(big5Options.buffer)) {
    var buffer2 = fs.readFileSync(big5Options.buffer);
    big5Options.buffer = big5Options.byte === 2 ? new Uint16Array(buffer2.buffer) : new Uint32Array(buffer2.buffer);
  }

  if (goog.isString(gb18030Options.buffer)) {
    var buffer3 = fs.readFileSync(gb18030Options.buffer);
    gb18030Options.buffer = gb18030Options.byte === 2 ?
      new Uint16Array(buffer3.buffer) : new Uint32Array(buffer3.buffer);
  }
});

describe('GBK Decoder unit test', function() {
  it('decode()', function() {
    var gbkTextBuffer = fs.readFileSync('test/txt/gbk/02-gbk.txt');
    var shiftJisDecoder = new decoder.Multibyte(shiftJisOption);
    expect(shiftJisDecoder.match(gbkTextBuffer)).toBe(false);

    var gbkDecoder = new decoder.Multibyte(gbkOptions);
    expect(gbkDecoder.getName()).toBe(gbkOptions.name);
    expect(gbkDecoder.getType()).toBe(CharmapType.DECODER);
    var unicodeBuffer = gbkDecoder.decode(gbkTextBuffer);
    expect(unicodeBuffer).not.toBeNull();
    var unicodeString = bufferutils.toString(unicodeBuffer);
    expect(unicodeString).toBe('任何读过黑塞作品的人，都会为黑塞作品中的人生阅历与感悟，以及浪漫气息所打动，' +
      '情不自禁回忆起自己的青年时代。青年没能在青年时代阅读黑塞，是一个极大的损失，尽管成年之后，重读时，会感受到这种懊悔，' +
      '这就是一位只要有过阅读，就一定会喜欢上的作家，一个性情中人，坦率的朋友，人生的导师。');
  });
});

describe('GBK Decoder unit test', function() {
  it('parse()', function() {
    var gbkTextBuffer = fs.readFileSync('test/txt/gbk/02-gbk.txt');
    var shiftJisDecoder = new decoder.Multibyte(shiftJisOption);
    expect(shiftJisDecoder.match(gbkTextBuffer)).toBe(false);

    var gbkDecoder = new decoder.Multibyte(gbkOptions);
    expect(gbkDecoder.getName()).toBe(gbkOptions.name);
    expect(gbkDecoder.getType()).toBe(CharmapType.DECODER);

    expect(gbkDecoder.parse(gbkTextBuffer)).toBe('任何读过黑塞作品的人，都会为黑塞作品中的人生阅历与感悟，以及浪漫气息所打动，' +
      '情不自禁回忆起自己的青年时代。青年没能在青年时代阅读黑塞，是一个极大的损失，尽管成年之后，重读时，会感受到这种懊悔，' +
      '这就是一位只要有过阅读，就一定会喜欢上的作家，一个性情中人，坦率的朋友，人生的导师。');
  });
});

describe('Big5 Decoder unit test', function() {
  it('decode()', function() {
    var big5TextBuffer0 = fs.readFileSync('test/txt/big5/01-big5.cue');
    var gbkDecoder = new decoder.Multibyte(gbkOptions);
    expect(gbkDecoder.match(big5TextBuffer0)).toBe(false);

    var big5TextBuffer = fs.readFileSync('test/txt/big5/02-big5.cue');
    var big5Decoder = new decoder.Multibyte(big5Options);
    expect(big5Decoder.getName()).toBe(big5Options.name);
    expect(big5Decoder.getType()).toBe(CharmapType.DECODER);
    var unicodeBuffer = big5Decoder.decode(big5TextBuffer);
    expect(unicodeBuffer).not.toBeNull();
    var utf8Buffer = encodingrule.UTF8.encode(unicodeBuffer);
    fs.writeFileSync('test/out/decoding-test-big5-in-utf8-out.cue', consts.UTF8_BOM, {flag: 'w+'});
    fs.writeFileSync('test/out/decoding-test-big5-in-utf8-out.cue', utf8Buffer, {flag: 'a+'});
  });
});

describe('GB18030 Decoder unit test', function() {
  it('decode()', function() {
    var gb18030Decoder = new decoder.Multibyte(gb18030Options);
    expect(gb18030Decoder.getName()).toBe(gb18030Options.name);
    expect(gb18030Decoder.getType()).toBe(CharmapType.DECODER);
    var gb18030TextBuffer = fs.readFileSync('test/txt/gb18030/01-gb18030.txt');
    var unicodeBuffer = gb18030Decoder.decode(gb18030TextBuffer);
    expect(unicodeBuffer).not.toBeNull();

    var utf16leBuffer = encodingrule.UTF16LE.encode(unicodeBuffer);
    fs.writeFileSync('test/out/decoding-test-gb18030-in-utf16le-out.txt', consts.UTF16LE_BOM, {flag: 'w+'});
    fs.writeFileSync('test/out/decoding-test-gb18030-in-utf16le-out.txt', utf16leBuffer, {flag: 'a+'});

    var utf16beBuffer = encodingrule.UTF16BE.encode(unicodeBuffer);
    fs.writeFileSync('test/out/decoding-test-gb18030-in-utf16be-out.txt', consts.UTF16BE_BOM, {flag: 'w+'});
    fs.writeFileSync('test/out/decoding-test-gb18030-in-utf16be-out.txt', utf16beBuffer, {flag: 'a+'});
  });
});

describe('UTF16LE Decoder unit test', function() {
  it('decode() - performance', function() {
    var ts = new Date;

    expect(decoder.UTF16LE.getName()).toBe('UTF-16LE');
    expect(decoder.UTF16LE.getType()).toBe(CharmapType.DECODER);

    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/bungakusyoujyo-unicode.txt');
    expect(decoder.UTF16LE.match(utf16TextBuffer)).toBe(true);
    expect(decoder.UTF16LE.hasBom(utf16TextBuffer)).toBe(true);
    expect(decoder.UTF16LE.match(utf16TextBuffer, 2)).toBe(true);

    var unicodeBuffer = decoder.UTF16LE.decode(utf16TextBuffer);
    expect(unicodeBuffer).not.toBeNull();
    var utf8Buffer = encodingrule.UTF8.encode(unicodeBuffer);
    expect(decoder.UTF8.hasBom(utf8Buffer)).toBe(true);
    expect(decoder.UTF8.match(utf8Buffer)).toBe(true);
    fs.writeFileSync('test/out/decoding-test-utf16le-in-utf8-out.txt', utf8Buffer, {flag: 'w+'});

    console.log('Consumed time: ' + (new Date - ts) + 'ms');
  });

  it('unparse()', function() {
    var ts = new Date;

    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/bungakusyoujyo-unicode.txt');
    var unicodeString = decoder.UTF16LE.parse(utf16TextBuffer);
    expect(unicodeString).not.toBe('');
    // BOM is removed
    expect(unicodeString.codePointAt(0)).not.toBe(consts.UNICODE_BYTE_ORDER_MARK);

    console.log('Consumed time: ' + (new Date - ts) + 'ms');
  });
});

describe('UTF16BE Decoder unit test', function() {
  it('decode() - performance', function() {
    var ts = new Date;

    expect(decoder.UTF16BE.getName()).toBe('UTF-16BE');
    expect(decoder.UTF16BE.getType()).toBe(CharmapType.DECODER);

    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/bungakusyoujyo-unicode-orig-be.txt');
    expect(decoder.UTF16BE.match(utf16TextBuffer)).toBe(true);
    expect(decoder.UTF16BE.hasBom(utf16TextBuffer)).toBe(true);
    expect(decoder.UTF16BE.match(utf16TextBuffer, 2)).toBe(true);

    var unicodeBuffer = decoder.UTF16BE.decode(utf16TextBuffer);
    expect(unicodeBuffer).not.toBeNull();
    var utf8Buffer = encodingrule.UTF8.encode(unicodeBuffer);
    expect(decoder.UTF8.hasBom(utf8Buffer)).toBe(true);
    expect(decoder.UTF8.match(utf8Buffer)).toBe(true);
    fs.writeFileSync('test/out/decoding-test-utf16be-in-utf8-out.txt', utf8Buffer, {flag: 'w+'});

    console.log('Consumed time: ' + (new Date - ts) + 'ms');
  });
});
