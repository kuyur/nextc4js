var fs = require('fs');
var channel = require('../lib/channel');
var decoder = require('../lib/decoder');
var encoder = require('../lib/encoder');
var converter = require('../lib/converter');
var consts = require('../lib/consts');

var options = {
  'name': 'shift-jis-decoder',
  'description': 'Shift-JIS to Unicode.',
  'version': 'CP932',
  'type': 'decoder',
  'path': 'charmaps/front-jis2u-little-endian.map',
  'rules': [
    {
      'byte': 1,
      'condition': ['0x00~0x7F']
    }, {
      'byte': 1,
      'condition': ['0xA1~0xDF']
    }, {
      'byte': 2,
      'condition': ['0x81~0x9F', '0x40~0xFC']
    }, {
      'byte': 2,
      'condition': ['0xE0~0xFC', '0x40~0xFC']
    }
  ],
  'segments': [{
    'begin': 0,
    'end': 127,
    'reference': 'ascii',
    'characterset': 'ascii'
  }, {
    'begin': 128,
    'end': 160,
    'reference': 'undefined',
    'characterset': 'undefined'
  }, {
    'begin': 161,
    'end': 223,
    'reference': 'buffer',
    'offset': 0,
    'characterset': 'JIS-X-0201'
  }, {
    'begin': 224,
    'end': 33087,
    'reference': 'undefined',
    'characterset': 'undefined'
  }, {
    'begin': 33088,
    'end': 65535,
    'reference': 'buffer',
    'offset': 63,
    'characterset': 'JIS-X-0208'
  }]
};

var tra2simpOptions = {
  'name': 'tra2simp-medium',
  'description': 'Traditional Chinese character to Simplified Chinese character basing on UCS2 (Unicode BMP).',
  'version': 'Unicode 4.0 Unihan(Wikipedia version)',
  'type': 'converter',
  'path': 'charmaps/medium-tra2simp-little-endian.map',
  'bytes': 2,
  'segments':[
    {
      'begin': 0,
      'end': 17078,
      'reference': 'self',
      'characterset': 'Unicode BMP'
    }, {
      'begin': 17079,
      'end': 40860,
      'reference': 'buffer',
      'offset': 0,
      'characterset': 'Unicode BMP'
    }, {
      'begin': 40861,
      'end': 65535,
      'reference': 'self',
      'characterset': 'Unicode BMP'
    }, {
      'begin': 65536,
      'end': 1114111,
      'reference': 'self',
      'characterset': 'Unicode SP'
    }
  ]
};

describe('Channel unit test', function() {
  it('process()', function() {
    var charmap = fs.readFileSync(options.path);
    var shiftJis = new decoder.Multibyte(options, new Uint16Array(charmap.buffer));
    var chann = new channel.Channel(shiftJis, encoder.UTF8);

    expect(chann.process(null)).toBe(null);

    var buffer = fs.readFileSync('test/txt/shift-jis/01-shift-jis.txt');
    expect(chann.match(buffer)).toBe(true);
    var output = chann.process(buffer);
    expect(output).not.toBeNull();
    fs.open('test/out/channel-test-shiftjis-in-utf8-out.txt', 'w+', function(err, fd) {
      fs.writeSync(fd, consts.UTF8_BOM, 0, consts.UTF8_BOM.length, 0);
      fs.writeSync(fd, output, 0, output.length, consts.UTF8_BOM.length);
      fs.closeSync(fd);
    });
  });

  it('process() with converter', function() {
    var charmap = fs.readFileSync(options.path);
    var shiftJis = new decoder.Multibyte(options, new Uint16Array(charmap.buffer));

    var t2scharmap = fs.readFileSync(tra2simpOptions.path);
    var t2s = new converter.Converter(tra2simpOptions, new Uint16Array(t2scharmap.buffer));

    var chann = new channel.Channel(shiftJis, encoder.UTF16LE, t2s);
    var buffer = fs.readFileSync('test/txt/shift-jis/02-shift-jis.txt');
    expect(chann.match(buffer)).toBe(true);
    var outputArray = chann.process(buffer);
    expect(outputArray).not.toBeNull();
    var outputBuffer = Buffer.from(outputArray);
    expect(outputBuffer.toString('utf16le')).toBe('一章　远子先辈は、美食家です');

    var chann2 = new channel.Channel(shiftJis, encoder.UTF16LE, [t2s]);
    var outputArray2 = chann2.process(buffer);
    expect(outputArray2).toEqual(outputArray);
  });
});