var { loadFromUrl } = require('../lib/load-from-url');
var utils = require('../lib/buffer-utils');
var { UTF8, UTF16LE } = require('../lib/decoder');
const fs = require('fs');
const nodeFetch = require('node-fetch');
if (!globalThis.fetch) {
  globalThis.fetch = nodeFetch;
}

beforeAll(() => {
  if (!fs.existsSync('test/out')) {
    fs.mkdirSync('test/out');
  }
});

describe('Loading Context unit test', function() {
  it('loadFromUrl() - anisong', function() {
    var promise = loadFromUrl('https://kuyur.github.io/unicue-online/presets/context-anisong.json');
    return promise.then(context => {
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

      var encoders_list = context.getEncoderNames();
      expect(encoders_list.length).toBe(3);
      expect(encoders_list[0]).toBe('UTF-8');
      expect(encoders_list[1]).toBe('UTF-16LE');
      expect(encoders_list[2]).toBe('UTF-16BE');

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
    });
  });

  it('loadFromUrl() - chinese', function() {
    var promise = loadFromUrl('https://kuyur.github.io/unicue-online/presets/context-chinese.json');
    return promise.then(context => {
      expect(context).not.toBe(null);

      var decoders_list = context.getDecoderNames();
      expect(decoders_list.length).toBe(5);
      expect(decoders_list[0]).toBe('UTF-8');
      expect(decoders_list[1]).toBe('UTF-16LE');
      expect(decoders_list[2]).toBe('UTF-16BE');
      expect(decoders_list[3]).toBe('GBK(CP936)');
      expect(decoders_list[4]).toBe('BIG5(UAO2.50)');
  
      var encoders_list = context.getEncoderNames();
      expect(encoders_list.length).toBe(3);
      expect(encoders_list[0]).toBe('UTF-8');
      expect(encoders_list[1]).toBe('UTF-16LE');
      expect(encoders_list[2]).toBe('UTF-16BE');
  
      var converters_list = context.getConverterNames();
      expect(converters_list.length).toBe(2);
      expect(converters_list[0]).toBe('simp2tra');
      expect(converters_list[1]).toBe('tra2simp');
  
      var channels_list = context.getChannelNames();
      expect(channels_list.length).toBe(2);
      expect(channels_list[0]).toBe('GBK_to_UTF16-LE_Traditionalized');
      expect(channels_list[1]).toBe('BIG5_to_UTF16-LE_Simplified');
  
      var chann = context.getChannel('GBK_to_UTF16-LE_Traditionalized');
      var gbkBuffer = fs.readFileSync('test/txt/gbk/02-gbk.txt');
      expect(chann.match(gbkBuffer)).toBe(true);
      var output = chann.process(gbkBuffer);
      expect(output).not.toBeNull();
      expect(utils.toString(UTF16LE.decode(output))).toBe('任何讀過黑塞作品的人，都會为黑塞作品中的人生阅历與感悟，' +
        '以及浪漫氣息所打動，情不自禁回憶起自己的青年時代。青年沒能在青年時代阅讀黑塞，是一個极大的損失，尽管成年之後，重讀時，' +
        '會感受到這種懊悔，這就是一位只要有過阅讀，就一定會喜歡上的作家，一個性情中人，坦率的朋友，人生的導師。');
  
      var gbk = context.getDecoder('GBK(CP936)');
      var utf16buffer = gbk.decode(gbkBuffer);
      expect(utils.toString(utf16buffer)).toBe('任何读过黑塞作品的人，都会为黑塞作品中的人生阅历与感悟，' +
        '以及浪漫气息所打动，情不自禁回忆起自己的青年时代。青年没能在青年时代阅读黑塞，是一个极大的损失，尽管成年之后，重读时，' +
        '会感受到这种懊悔，这就是一位只要有过阅读，就一定会喜欢上的作家，一个性情中人，坦率的朋友，人生的导师。');
  
      var simp2tra = context.getConverter('simp2tra');
      expect(utils.toString(simp2tra.convert(utf16buffer))).toBe('任何讀過黑塞作品的人，都會为黑塞作品中的人生阅历與感悟，' +
        '以及浪漫氣息所打動，情不自禁回憶起自己的青年時代。青年沒能在青年時代阅讀黑塞，是一個极大的損失，尽管成年之後，重讀時，' +
        '會感受到這種懊悔，這就是一位只要有過阅讀，就一定會喜歡上的作家，一個性情中人，坦率的朋友，人生的導師。');
    });
    
  });

  it('loadFromUrl() - gb18030', function() {
    var promise = loadFromUrl('https://kuyur.github.io/unicue-online/presets/context-gb18030.json');
    promise.then(context => {
      expect(context).not.toBe(null);

      var decoders_list = context.getDecoderNames();
      expect(decoders_list.length).toBe(4);
      expect(decoders_list[0]).toBe('UTF-8');
      expect(decoders_list[1]).toBe('UTF-16LE');
      expect(decoders_list[2]).toBe('UTF-16BE');
      expect(decoders_list[3]).toBe('GB18030');
  
      var encoders_list = context.getEncoderNames();
      expect(encoders_list.length).toBe(4);
      expect(encoders_list[0]).toBe('UTF-8');
      expect(encoders_list[1]).toBe('UTF-16LE');
      expect(encoders_list[2]).toBe('UTF-16BE');
      expect(encoders_list[3]).toBe('GB18030');
  
      var converters_list = context.getConverterNames();
      expect(converters_list.length).toBe(0);
  
      var channels_list = context.getChannelNames();
      expect(channels_list.length).toBe(2);
      expect(channels_list[0]).toBe('UTF-16LE_to_GB18030');
      expect(channels_list[1]).toBe('GB18030_to_UTF-16LE');
  
      var chann = context.getChannel('GB18030_to_UTF-16LE');
      var gb18030Buffer = fs.readFileSync('test/txt/gb18030/02-gb18030.txt');
      expect(chann.match(gb18030Buffer)).toBe(true);
      var output0 = chann.process(gb18030Buffer);
      expect(output0).not.toBeNull();
      expect(utils.toString(UTF16LE.decode(output0))).toBe('ḿǹ〾⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻⺁⺄㑳㑇⺈⺋㖞㘚㘎⺌⺗' +
        '㥮㤘㧏㧟㩳㧐㭎㱮㳠⺧⺪䁖䅟⺮䌷⺳⺶⺷䎱䎬⺻䏝䓖䙡䙌䜣䜩䝼䞍⻊䥇䥺䥽䦂䦃䦅䦆䦟䦛䦷䦶䲣䲟䲠䲡䱷䲢䴓䴔䴕䴖䴗䴘䴙䶮');
  
      var gb18030Decoder = context.getDecoder('GB18030');
      var utf16buffer = gb18030Decoder.decode(gb18030Buffer);
      expect(utils.toString(utf16buffer)).toBe('ḿǹ〾⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻⺁⺄㑳㑇⺈⺋㖞㘚㘎⺌⺗' +
      '㥮㤘㧏㧟㩳㧐㭎㱮㳠⺧⺪䁖䅟⺮䌷⺳⺶⺷䎱䎬⺻䏝䓖䙡䙌䜣䜩䝼䞍⻊䥇䥺䥽䦂䦃䦅䦆䦟䦛䦷䦶䲣䲟䲠䲡䱷䲢䴓䴔䴕䴖䴗䴘䴙䶮');
  
      var str = '𝌀𝌁𝌂𝌃𝌄𝌅𝌆𝌇𝌈𝌉𝌊𝌋𝌌𝌍𝌎𝌏𝌐𝌑𝌒𝌓𝌔𝌕𝌖𝌗𝌘𝌙𝌚𝌛𝌜𝌝𝌞𝌟𝌠𝌡𝌢𝌣𝌤𝌥𝌦𝌧𝌨𝌩𝌪𝌫𝌬𝌭𝌮𝌯𝌰𝌱𝌲𝌳𝌴𝌵𝌶𝌷𝌸' +
        '𝌹𝌺𝌻𝌼𝌽𝌾𝌿𝍀𝍁𝍂𝍃𝍄𝍅𝍆𝍇𝍈𝍉𝍊𝍋𝍌𝍍𝍎𝍏𝍐𝍑𝍒𝍓𝍔𝍕𝍖';
      var uint32Buffer = utils.toBuffer(str);
      var gb18030Encoder = context.getEncoder('GB18030');
      var output = gb18030Encoder.encode(uint32Buffer);
      expect(output.length).toBe(str.length * 2);
      // 𝌀 in GB18030
      expect(output[0]).toBe(0x94);
      expect(output[1]).toBe(0x32);
      expect(output[2]).toBe(0xEE);
      expect(output[3]).toBe(0x36);
      // 𝍖 in GB18030
      expect(output[output.length - 4]).toBe(0x94);
      expect(output[output.length - 3]).toBe(0x32);
      expect(output[output.length - 2]).toBe(0xF7);
      expect(output[output.length - 1]).toBe(0x32);
    });
  });
});