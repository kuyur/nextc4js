const json = require('../presets-charmap-embedded/context-default.json');
const utils = require('../lib/buffer-utils');
const { UTF8 } = require('../lib/decoder');
const fs = require('fs');
const { Context } = require('../lib/context');
const consts = require('../lib/consts');

describe('Context unit test', function() {
  it ('Context() - construct with empty configs', function() {
    var context = new Context();
    expect(context).not.toBe(null);

    var decoders_list = context.getDecoderNames();
    expect(decoders_list.length).toBe(3);
    expect(decoders_list[0]).toBe('UTF-8');
    expect(decoders_list[1]).toBe('UTF-16LE');
    expect(decoders_list[2]).toBe('UTF-16BE');

    var encoders_list = context.getEncoderNames();
    expect(encoders_list.length).toBe(3);
    expect(encoders_list[0]).toBe('UTF-8');
    expect(encoders_list[1]).toBe('UTF-16LE');
    expect(encoders_list[2]).toBe('UTF-16BE');
  });

  it('getDecoderNames() - default context', function() {
    var context = new Context(json);
    expect(context).not.toBe(null);

    var decoders_list = context.getDecoderNames();
    expect(decoders_list.length).toBe(9);
    expect(decoders_list[0]).toBe('UTF-8');
    expect(decoders_list[1]).toBe('UTF-16LE');
    expect(decoders_list[2]).toBe('UTF-16BE');
    expect(decoders_list[3]).toBe('Shift-JIS(CP932)');
    expect(decoders_list[4]).toBe('GBK(CP936)');
    expect(decoders_list[5]).toBe('BIG5(UAO2.50)');
    expect(decoders_list[6]).toBe('EUC-KR(CP949)');
    expect(decoders_list[7]).toBe('Latin(CP1252)');
    expect(decoders_list[8]).toBe('Cyrillic(CP1251)');
  });

  it('getEncoderNames() - default context', function() {
    var context = new Context(json);

    var encoders_list = context.getEncoderNames();
    expect(encoders_list.length).toBe(3);
    expect(encoders_list[0]).toBe('UTF-8');
    expect(encoders_list[1]).toBe('UTF-16LE');
    expect(encoders_list[2]).toBe('UTF-16BE');
  });

  it('getConverterNames() - default context', function() {
    var context = new Context(json);

    var converters_list = context.getConverterNames();
    expect(converters_list.length).toBe(0);

    var channels_list = context.getChannelNames();
    expect(channels_list.length).toBe(6);
    expect(channels_list[0]).toBe('Shift-JIS_to_UTF-8');
    expect(channels_list[1]).toBe('GBK_to_UTF-8');
    expect(channels_list[2]).toBe('BIG5_to_UTF-8');
    expect(channels_list[3]).toBe('EUC-KR-CP949_to_UTF-8');
    expect(channels_list[4]).toBe('Latin-CP1252_to_UTF-8');
    expect(channels_list[5]).toBe('Cyrillic-CP1251_to_UTF-8');

    var shiftJisToUtf8 = context.getChannel('Shift-JIS_to_UTF-8');
    var shiftJisBuffer = fs.readFileSync('test/txt/shift-jis/02-shift-jis.txt');
    expect(shiftJisToUtf8.match(shiftJisBuffer)).toBe(true);
    var output = shiftJisToUtf8.process(shiftJisBuffer);
    expect(output).not.toBeNull();
    expect(Buffer.from(output).toString('utf-8')).toBe('一章　遠子先輩は、美食家です');
    expect(utils.toString(UTF8.decode(output))).toBe('一章　遠子先輩は、美食家です');

    var gbkBuffer = fs.readFileSync('test/txt/gbk/02-gbk.txt');
    var result = context.findPossibleEncoding(gbkBuffer);
    expect(result).not.toBe(null);
    expect(result.encoding).toBe('GBK(CP936)');
    expect(result.hasBom).toBe(false);
    var gbk = context.getDecoder('GBK(CP936)');
    var utf16buffer = gbk.decode(gbkBuffer);
    expect(utils.toString(utf16buffer)).toBe('任何读过黑塞作品的人，都会为黑塞作品中的人生阅历与感悟，' +
      '以及浪漫气息所打动，情不自禁回忆起自己的青年时代。青年没能在青年时代阅读黑塞，是一个极大的损失，尽管成年之后，重读时，' +
      '会感受到这种懊悔，这就是一位只要有过阅读，就一定会喜欢上的作家，一个性情中人，坦率的朋友，人生的导师。');
  });

  it('getChannelNames() - default context', function() {
    var context = new Context(json);

    var channels_list = context.getChannelNames();
    expect(channels_list.length).toBe(6);
    expect(channels_list[0]).toBe('Shift-JIS_to_UTF-8');
    expect(channels_list[1]).toBe('GBK_to_UTF-8');
    expect(channels_list[2]).toBe('BIG5_to_UTF-8');
    expect(channels_list[3]).toBe('EUC-KR-CP949_to_UTF-8');
    expect(channels_list[4]).toBe('Latin-CP1252_to_UTF-8');
    expect(channels_list[5]).toBe('Cyrillic-CP1251_to_UTF-8');

    var shiftJisToUtf8 = context.getChannel('Shift-JIS_to_UTF-8');
    var shiftJisBuffer = fs.readFileSync('test/txt/shift-jis/02-shift-jis.txt');
    expect(shiftJisToUtf8.match(shiftJisBuffer)).toBe(true);
    var output = shiftJisToUtf8.process(shiftJisBuffer);
    expect(output).not.toBeNull();
    expect(Buffer.from(output).toString('utf-8')).toBe('一章　遠子先輩は、美食家です');
    expect(utils.toString(UTF8.decode(output))).toBe('一章　遠子先輩は、美食家です');

    var gbkBuffer = fs.readFileSync('test/txt/gbk/02-gbk.txt');
    var result = context.findPossibleEncoding(gbkBuffer);
    expect(result).not.toBe(null);
    expect(result.encoding).toBe('GBK(CP936)');
    expect(result.hasBom).toBe(false);
    var gbk = context.getDecoder('GBK(CP936)');
    var utf16buffer = gbk.decode(gbkBuffer);
    expect(utils.toString(utf16buffer)).toBe('任何读过黑塞作品的人，都会为黑塞作品中的人生阅历与感悟，' +
      '以及浪漫气息所打动，情不自禁回忆起自己的青年时代。青年没能在青年时代阅读黑塞，是一个极大的损失，尽管成年之后，重读时，' +
      '会感受到这种懊悔，这就是一位只要有过阅读，就一定会喜欢上的作家，一个性情中人，坦率的朋友，人生的导师。');
  });

  it('getChannel() - default context', function() {
    var context = new Context(json);

    var shiftJisToUtf8 = context.getChannel('Shift-JIS_to_UTF-8');
    var shiftJisBuffer = fs.readFileSync('test/txt/shift-jis/02-shift-jis.txt');
    expect(shiftJisToUtf8.match(shiftJisBuffer)).toBe(true);
    var output = shiftJisToUtf8.process(shiftJisBuffer);
    expect(output).not.toBeNull();
    expect(Buffer.from(output).toString('utf-8')).toBe('一章　遠子先輩は、美食家です');
    expect(utils.toString(UTF8.decode(output))).toBe('一章　遠子先輩は、美食家です');
  });

  it('findPossibleEncoding() - default context', function() {
    var context = new Context(json);

    var gbkBuffer = fs.readFileSync('test/txt/gbk/02-gbk.txt');
    var result = context.findPossibleEncoding(gbkBuffer);
    expect(result).not.toBe(null);
    expect(result.encoding).toBe('GBK(CP936)');
    expect(result.hasBom).toBe(false);
    var gbk = context.getDecoder('GBK(CP936)');
    var utf16buffer = gbk.decode(gbkBuffer);
    expect(utils.toString(utf16buffer)).toBe('任何读过黑塞作品的人，都会为黑塞作品中的人生阅历与感悟，' +
      '以及浪漫气息所打动，情不自禁回忆起自己的青年时代。青年没能在青年时代阅读黑塞，是一个极大的损失，尽管成年之后，重读时，' +
      '会感受到这种懊悔，这就是一位只要有过阅读，就一定会喜欢上的作家，一个性情中人，坦率的朋友，人生的导师。');

    var utf8BufferWithBom = new Uint8Array([0xEF, 0xBB, 0xBF,
      228, 184, 128, 231, 171, 160, 227, 128, 128, 233, 129, 160, 229, 173,
      144, 229, 133, 136, 232, 188, 169, 227, 129, 175, 227, 128, 129, 231, 190, 142, 233, 163, 159, 229, 174, 182,
      227, 129, 167, 227, 129, 153]);
    expect(context.findPossibleEncoding(utf8BufferWithBom)).toEqual({
      encoding: 'UTF-8',
      hasBom: true
    });

    var utf8BufferWithoutBom = new Uint8Array([228, 184, 128, 231, 171, 160, 227, 128, 128, 233, 129, 160, 229, 173,
      144, 229, 133, 136, 232, 188, 169, 227, 129, 175, 227, 128, 129, 231, 190, 142, 233, 163, 159, 229, 174, 182,
      227, 129, 167, 227, 129, 153]);
    expect(context.findPossibleEncoding(utf8BufferWithoutBom)).toEqual({
      encoding: 'UTF-8',
      hasBom: false
    });

    var utf16leBuffer = new Uint8Array([0xFF, 0xFE,
      0, 78, 224, 122, 0, 48, 96, 144, 80, 91, 72, 81, 41, 143, 111,
      48, 1, 48, 142, 127, 223, 152, 182, 91, 103, 48, 89, 48
    ]);
    expect(context.findPossibleEncoding(utf16leBuffer)).toEqual({
      encoding: 'UTF-16LE',
      hasBom: true
    });

    var utf16beBuffer = new Uint8Array([0xFE, 0xFF,
      78, 0, 122, 224, 48, 0, 144, 96, 91, 80, 81, 72, 143, 41, 48, 111,
      48, 1, 127, 142, 152, 223, 91, 182, 48, 103, 48, 89
    ]);
    expect(context.findPossibleEncoding(utf16beBuffer)).toEqual({
      encoding: 'UTF-16BE',
      hasBom: true
    });

    var wrongBuffer = new Uint8Array([0xFF, 0xFF, 0xFF]);
    expect(context.findPossibleEncoding(wrongBuffer)).toBe(null);
  });

  it('decode()', function() {
    var context = new Context(json);

    var shiftJisBuffer = fs.readFileSync('test/txt/shift-jis/02-shift-jis.txt');
    var uint32buffer = context.decode(shiftJisBuffer, 'Shift-JIS(CP932)');
    expect(utils.toString(uint32buffer)).toBe('一章　遠子先輩は、美食家です');

    expect(() => context.decode(shiftJisBuffer, 'HOGEHOGE')).
      toThrow('Error: decoder HOGEHOGE not found in the context.');
  });

  it('decodeAsString()', function() {
    var context = new Context(json);

    var shiftJisBuffer = fs.readFileSync('test/txt/shift-jis/02-shift-jis.txt');
    var utf16Str = context.decodeAsString(shiftJisBuffer, 'Shift-JIS(CP932)');
    expect(utf16Str).toBe('一章　遠子先輩は、美食家です');

    expect(() => context.decodeAsString(shiftJisBuffer, 'HOGEHOGE')).
      toThrow('Error: decoder HOGEHOGE not found in the context.');

    var utf8BufferWithBom = new Uint8Array([0xEF, 0xBB, 0xBF,
      228, 184, 128, 231, 171, 160, 227, 128, 128, 233, 129, 160, 229, 173,
      144, 229, 133, 136, 232, 188, 169, 227, 129, 175, 227, 128, 129, 231, 190, 142, 233, 163, 159, 229, 174, 182,
      227, 129, 167, 227, 129, 153]);
    expect(context.decodeAsString(utf8BufferWithBom, 'UTF-8')).toBe('一章　遠子先輩は、美食家です');

    var utf8BufferWithoutBom = new Uint8Array([228, 184, 128, 231, 171, 160, 227, 128, 128, 233, 129, 160, 229, 173,
      144, 229, 133, 136, 232, 188, 169, 227, 129, 175, 227, 128, 129, 231, 190, 142, 233, 163, 159, 229, 174, 182,
      227, 129, 167, 227, 129, 153]);
    expect(context.decodeAsString(utf8BufferWithoutBom, 'UTF-8')).toBe('一章　遠子先輩は、美食家です');
  });

  it('encode()', function() {
    var context = new Context(json);

    var uint32buffer = utils.toBuffer('一章　遠子先輩は、美食家です');
    var utf8Buffer = context.encode(uint32buffer, 'UTF-8');
    expect(utf8Buffer).toEqual(new Uint8Array([228, 184, 128, 231, 171, 160, 227, 128, 128, 233, 129, 160, 229, 173,
      144, 229, 133, 136, 232, 188, 169, 227, 129, 175, 227, 128, 129, 231, 190, 142, 233, 163, 159, 229, 174, 182,
      227, 129, 167, 227, 129, 153]));

    var uint32bufferWithBom = utils.toBuffer(String.fromCodePoint(consts.UNICODE_BYTE_ORDER_MARK) +
      '一章　遠子先輩は、美食家です');
    var utf8BufferWithBom = context.encode(uint32bufferWithBom, 'UTF-8');
    expect(utf8BufferWithBom).toEqual(new Uint8Array([0xEF, 0xBB, 0xBF,
      228, 184, 128, 231, 171, 160, 227, 128, 128, 233, 129, 160, 229, 173,
      144, 229, 133, 136, 232, 188, 169, 227, 129, 175, 227, 128, 129, 231, 190, 142, 233, 163, 159, 229, 174, 182,
      227, 129, 167, 227, 129, 153]));

    expect(() => context.encode(uint32buffer, 'HOGEHOGE')).
      toThrow('Error: encoder HOGEHOGE not found in the context.');
  });

  it('encodeFromString()', function() {
    var context = new Context(json);

    var utf8BufferWithoutBom = context.encodeFromString('一章　遠子先輩は、美食家です', 'UTF-8', false);
    expect(utf8BufferWithoutBom).toEqual(new Uint8Array([
      228, 184, 128, 231, 171, 160, 227, 128, 128, 233, 129, 160, 229, 173,
      144, 229, 133, 136, 232, 188, 169, 227, 129, 175, 227, 128, 129, 231, 190, 142, 233, 163, 159, 229, 174, 182,
      227, 129, 167, 227, 129, 153]));

    var utf8BufferWithBom = context.encodeFromString('一章　遠子先輩は、美食家です', 'UTF-8', true);
    expect(utf8BufferWithBom).toEqual(new Uint8Array([0xEF, 0xBB, 0xBF,
      228, 184, 128, 231, 171, 160, 227, 128, 128, 233, 129, 160, 229, 173,
      144, 229, 133, 136, 232, 188, 169, 227, 129, 175, 227, 128, 129, 231, 190, 142, 233, 163, 159, 229, 174, 182,
      227, 129, 167, 227, 129, 153]));

    var utf8BufferWithBom2 = context.encodeFromString(String.fromCodePoint(consts.UNICODE_BYTE_ORDER_MARK) +
      '一章　遠子先輩は、美食家です', 'UTF-8', true);
    expect(utf8BufferWithBom2).toEqual(utf8BufferWithBom);

    expect(() => context.encodeFromString('', 'HOGEHOGE')).
      toThrow('Error: encoder HOGEHOGE not found in the context.');

    expect(context.encodeFromString('', 'UTF-16LE', true)).toEqual(consts.UTF16LE_BOM);
    expect(context.encodeFromString('', 'UTF-16BE', true)).toEqual(consts.UTF16BE_BOM);

    expect(() => context.encodeFromString(1234, 'UTF-8')).toThrow('Error: invalid type for str.');
  });
});
