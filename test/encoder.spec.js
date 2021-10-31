var fs = require('fs');
var encoder = require('../lib/encoder');
var decoder = require('../lib/decoder');
const { CharmapType } = require('../lib/charmap');

var gb18030Options =  {
  'name': 'gb18030-encoder',
  'description': 'Unicode to GB18030.',
  'version': 'GB18030-2005',
  'type': 'encoder',
  'path': 'charmaps/back-u2gb18030-little-endian.map',
  'segments': [{
    'begin': 0,
    'end': 65535,
    'reference': 'buffer',
    'characterset': 'Unicode BMP',
    'offset': 0
  }, {
    'begin': 65536,
    'end': 1114111,
    'reference': 'gb18030-unicode-sp-mapping',
    'characterset': 'Unicode (SP)'
  }]
};

beforeAll(() => {
  if (!fs.existsSync('test/out')) {
    fs.mkdirSync('test/out');
  }
});

describe('UTF16LE encoder unit test', function() {
  it('encode()', function() {
    var ts = new Date;
    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/bungakusyoujyo-unicode.txt');
    var unicodeBuffer = decoder.UTF16LE.decode(utf16TextBuffer);
    expect(unicodeBuffer).not.toBeNull();
    expect(encoder.UTF16LE.getName()).toBe('UTF-16 (little-endian)');
    expect(encoder.UTF16LE.getType()).toBe(CharmapType.ENCODER);
    var utf16Buffer = encoder.UTF16LE.encode(unicodeBuffer);
    fs.writeFileSync('test/out/encoding-test-utf16le-out.txt', utf16Buffer, {flag: 'w+'});
    console.log('Consumed time: ' + (new Date - ts) + 'ms');
  });
});

describe('UTF16LE encoder unit test 2', function() {
  it('encode()', function() {
    var ts = new Date;
    var utf8TextBuffer = fs.readFileSync('test/txt/utf-8/unicode-bmp-and-sp.txt');
    var unicodeBuffer = decoder.UTF8.decode(utf8TextBuffer);
    expect(unicodeBuffer).not.toBeNull();
    var utf16Buffer = encoder.UTF16LE.encode(unicodeBuffer);
    fs.writeFileSync('test/out/encoding-test-utf16le-out-2.txt', utf16Buffer, {flag: 'w+'});
    console.log('Consumed time: ' + (new Date - ts) + 'ms');
  });
});

describe('UTF16BE encoder unit test', function() {
  it('encode()', function() {
    var ts = new Date;
    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/bungakusyoujyo-unicode.txt');
    var unicodeBuffer = decoder.UTF16LE.decode(utf16TextBuffer);
    expect(unicodeBuffer).not.toBeNull();
    expect(encoder.UTF16BE.getName()).toBe('UTF-16 (big-endian)');
    expect(encoder.UTF16BE.getType()).toBe(CharmapType.ENCODER);
    var utf16Buffer = encoder.UTF16BE.encode(unicodeBuffer);
    fs.writeFileSync('test/out/encoding-test-utf16be-out.txt', utf16Buffer, {flag: 'w+'});
    console.log('Consumed time: ' + (new Date - ts) + 'ms');
  });
});

describe('UTF8 encoder unit test', function() {
  it('encode()', function() {
    var ts = new Date;
    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/bungakusyoujyo-unicode-orig.txt');
    var unicodeBuffer = decoder.UTF16LE.decode(utf16TextBuffer);
    expect(unicodeBuffer).not.toBeNull();
    expect(encoder.UTF8.getName()).toBe('UTF-8');
    expect(encoder.UTF8.getType()).toBe(CharmapType.ENCODER);
    var utf8Buffer = encoder.UTF8.encode(unicodeBuffer);
    fs.writeFileSync('test/out/encoding-test-utf8-out.txt', utf8Buffer, {flag: 'w+'});
    console.log('Consumed time: ' + (new Date - ts) + 'ms');
  });
});

describe('UTF8 encoder unit test 2', function() {
  it('encode()', function() {
    var ts = new Date;
    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/unicode-bmp-and-sp.txt');
    var unicodeBuffer = decoder.UTF16LE.decode(utf16TextBuffer);
    expect(unicodeBuffer).not.toBeNull();
    var utf8Buffer = encoder.UTF8.encode(unicodeBuffer);
    fs.writeFileSync('test/out/encoding-test-utf8-out2.txt', utf8Buffer, {flag: 'w+'});
    console.log('Consumed time: ' + (new Date - ts) + 'ms');
  });
});

describe('GB18030 encoder unit test', function() {
  it('encode()', function() {
    var utf16TextBuffer = fs.readFileSync('test/txt/utf-16/unicode-bmp-and-sp.txt');
    expect(decoder.UTF16LE.hasBom(utf16TextBuffer)).toBe(true);
    var unicodeBuffer = decoder.UTF16LE.decode(utf16TextBuffer, 2);
    expect(unicodeBuffer).not.toBeNull();
    var charmap = fs.readFileSync(gb18030Options.path);
    var gb18030Encoder = new encoder.Multibyte(gb18030Options, new Uint32Array(charmap.buffer));
    expect(gb18030Encoder.getName()).toBe(gb18030Options.name);
    expect(gb18030Encoder.getType()).toBe(CharmapType.ENCODER);
    var gb18030Buffer = gb18030Encoder.encode(unicodeBuffer);
    fs.writeFileSync('test/out/encoding-test-gb18030-out.txt', gb18030Buffer, {flag: 'w+'});
  });
});