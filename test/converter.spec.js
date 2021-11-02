var fs = require('fs');
var converter = require('../lib/converter');
var bufferutils = require('../lib/buffer-utils');
const { CharmapType } = require('../lib/charmap');
const { Reference } = require('../lib/segment');
const { UNICODE_UNKNOWN_CHAR } = require('../lib/consts');
var goog = require('../lib/goog-base');

var sim2traOptions= {
  'name': 'simp2tra-medium',
  'description': 'Simplified Chinese character to Traditional Chinese character basing on UCS2 (Unicode BMP).',
  'version': 'Unicode 4.0 Unihan(Wikipedia version)',
  'type': 'converter',
  'buffer': 'charmaps/medium-simp2tra-little-endian.map|2',
  'segments':[
    {
      'begin': 0,
      'end': 13725,
      'reference': 'self',
      'characterset': 'Unicode BMP'
    }, {
      'begin': 13726,
      'end': 40863,
      'reference': 'buffer',
      'offset': 0,
      'characterset': 'Unicode BMP'
    }, {
      'begin': 40864,
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

var tra2simpOptions = {
  'name': 'tra2simp-medium',
  'description': 'Traditional Chinese character to Simplified Chinese character basing on UCS2 (Unicode BMP).',
  'version': 'Unicode 4.0 Unihan(Wikipedia version)',
  'type': 'converter',
  'buffer': 'charmaps/medium-tra2simp-little-endian.map|2',
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

beforeAll(() => {
  if (goog.isString(sim2traOptions.buffer)) {
    var parts = sim2traOptions.buffer.split('|');
    var bytes = +parts[1];
    var buffer = fs.readFileSync(parts[0]);
    sim2traOptions.buffer = bytes === 2 ? new Uint16Array(buffer.buffer) : new Uint32Array(buffer.buffer);
  }

  if (goog.isString(tra2simpOptions.buffer)) {
    var parts2 = tra2simpOptions.buffer.split('|');
    var bytes2 = +parts2[1];
    var buffer2 = fs.readFileSync(parts2[0]);
    tra2simpOptions.buffer = bytes2 === 2 ? new Uint16Array(buffer2.buffer) : new Uint32Array(buffer2.buffer);
  }
});

describe('Simplified Chinese to Traditional Chinese Converter unit test', function() {
  it('convert()', function() {
    var s2t = new converter.Converter(sim2traOptions);
    expect(s2t.getName()).toBe(sim2traOptions.name);
    expect(s2t.getType()).toBe(CharmapType.CONVERTER);

    expect(s2t.convert(null)).toBe(null);

    var text = '铅球万袋一桶浆糊';
    var buffer = s2t.convert(bufferutils.toBuffer(text));
    expect(buffer).not.toBeNull();
    var converted = bufferutils.toString(buffer);
    expect(converted).toBe('鉛球萬袋一桶漿糊');
  });
});

describe('Traditional Chinese to Simplified Chinese Converter unit test', function() {
  it('convert()', function() {
    var t2s = new converter.Converter(tra2simpOptions);
    expect(t2s.getName()).toBe(tra2simpOptions.name);
    expect(t2s.getType()).toBe(CharmapType.CONVERTER);
    var text = '鉛球萬袋一桶漿糊';
    var buffer = t2s.convert(bufferutils.toBuffer(text));
    expect(buffer).not.toBeNull();
    var converted = bufferutils.toString(buffer);
    expect(converted).toBe('铅球万袋一桶浆糊');
  });
});

describe('Converter without mapping buffer', function() {
  it('Construtor', function() {
    expect(() => {new converter.Converter();}).toThrow('options should provide name property at least');
    expect(() => {new converter.Converter({});}).toThrow('options should provide name property at least');
  });

  it('convert() - 1', function() {
    var conv = new converter.Converter({
      name: 'test'
    });
    expect(conv.getName()).toBe('test');
    expect(conv.getType()).toBe(CharmapType.CONVERTER);

    var buffer = new Uint32Array([0x61]);
    expect(conv.convert(buffer)[0]).toBe(UNICODE_UNKNOWN_CHAR);
  });

  it('convert() - 2', function() {
    var conv2 = new converter.Converter({
      name: 'test2',
      segments:[
        {
          begin: 0x61,
          end: 0x7A,
          reference: Reference.BUFFER,
          characterset: 'a-z'
        }
      ]
    });
    expect(conv2.getName()).toBe('test2');
    expect(conv2.getType()).toBe(CharmapType.CONVERTER);

    var buffer = new Uint32Array([0x61]);
    expect(conv2.convert(buffer)[0]).toBe(UNICODE_UNKNOWN_CHAR);
  });

  it('convert() - 3', function() {
    var conv3 = new converter.Converter({
      name: 'test3',
      segments:[
        {
          begin: 0x61,
          end: 0x7A,
          reference: 'HOGEHOGE',
          characterset: 'a-z'
        }
      ]
    });
    expect(conv3.getName()).toBe('test3');
    expect(conv3.getType()).toBe(CharmapType.CONVERTER);

    var buffer = new Uint32Array([0x61]);
    expect(conv3.convert(buffer)[0]).toBe(UNICODE_UNKNOWN_CHAR);
  });
});