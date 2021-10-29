var fs = require('fs');
var channel = require('../lib/nextc4js/channel');
var decoder = require('../lib/nextc4js/decoder');
var encoder = require('../lib/nextc4js/encoder');
var consts = require('../lib/nextc4js/consts');
var test = require('tape');

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

test('Channel unit test', function(t) {
  t.test('process()', function(assert) {
    var charmap = fs.readFileSync(options.path);
    var shiftJis = new decoder.Multibyte(options, new Uint16Array(charmap.buffer));
    var chann = new channel.Channel(shiftJis, encoder.UTF8);
    var buffer = fs.readFileSync('test/txt/shift-jis/01-shift-jis.txt');
    assert.equal(chann.match(buffer), true);
    var output = chann.process(buffer);
    assert.equal(output != null, true);
    fs.open('test/out/channel-test-shiftjis-in-utf8-out.cue', 'w+', function(err, fd) {
      fs.writeSync(fd, consts.UTF8_BOM, 0, consts.UTF8_BOM.length, 0);
      fs.writeSync(fd, output, 0, output.length, consts.UTF8_BOM.length);
      fs.closeSync(fd);
    });
    assert.end();
  });
});