const utfUtils = require('../lib/utf-utils');

describe('UTF utils unit test', function() {
  it('toCodePoints()', function() {
    expect(utfUtils.toCodePoints('一章　遠子先輩は、美食家です')).toStrictEqual([
      19968, 31456, 12288, 36960, 23376, 20808, 36649,
      12399, 12289, 32654, 39135, 23478, 12391, 12377
    ]);

    expect(utfUtils.toCodePoints('abcαβγ中文𠂇𠂉𠃌')).toStrictEqual([
      97, 98, 99, 945, 946, 947, 20013, 25991, 131207, 131209, 131276
    ]);

    expect(utfUtils.toCodePoints(null)).toBeNull();
  });

  it('toUTF8Binary()', function() {
    expect(utfUtils.toUTF8Binary('一章　遠子先輩は、美食家です')).toStrictEqual([
      0xE4, 0xB8, 0x80, 0xE7, 0xAB, 0xA0, 0xE3, 0x80, 0x80, 0xE9, 0x81,
      0xA0, 0xE5, 0xAD, 0x90, 0xE5, 0x85, 0x88, 0xE8, 0xBC, 0xA9, 0xE3,
      0x81, 0xAF, 0xE3, 0x80, 0x81, 0xE7, 0xBE, 0x8E, 0xE9, 0xA3, 0x9F,
      0xE5, 0xAE, 0xB6, 0xE3, 0x81, 0xA7, 0xE3, 0x81, 0x99
    ]);

    expect(utfUtils.toUTF8Binary('abcαβγ中文𠂇𠂉𠃌')).toStrictEqual([
      97, 98, 99, 206, 177, 206, 178, 206, 179, 228, 184, 173, 230, 150,
      135, 240, 160, 130, 135, 240, 160, 130, 137, 240, 160, 131, 140
    ]);

    expect(utfUtils.toUTF8Binary(null)).toBeNull();
  });

  it('toUTF8Hex()', function() {
    expect(utfUtils.toUTF8Hex('一章　遠子先輩は、美食家です')).toStrictEqual([
      'E4', 'B8', '80', 'E7', 'AB', 'A0', 'E3', '80', '80', 'E9', '81',
      'A0', 'E5', 'AD', '90', 'E5', '85', '88', 'E8', 'BC', 'A9', 'E3',
      '81', 'AF', 'E3', '80', '81', 'E7', 'BE', '8E', 'E9', 'A3', '9F',
      'E5', 'AE', 'B6', 'E3', '81', 'A7', 'E3', '81', '99'
    ]);

    expect(utfUtils.toUTF8Hex('abcαβγ中文𠂇𠂉𠃌')).toStrictEqual([
      '61', '62', '63', 'CE', 'B1', 'CE', 'B2', 'CE', 'B3', 'E4', 'B8',
      'AD', 'E6', '96', '87', 'F0', 'A0', '82', '87', 'F0', 'A0', '82',
      '89', 'F0', 'A0', '83', '8C'
    ]);

    expect(utfUtils.toUTF8Hex(null)).toBeNull();
  });

  it('toUTF16LEBinary()', function() {
    expect(utfUtils.toUTF16LEBinary('一章　遠子先輩は、美食家です')).toStrictEqual([
      0, 78, 224, 122, 0, 48, 96, 144, 80, 91, 72, 81, 41, 143, 111, 48,
      1, 48, 142, 127, 223, 152, 182, 91, 103, 48, 89, 48
    ]);

    expect(utfUtils.toUTF16LEBinary('abcαβγ中文𠂇𠂉𠃌')).toStrictEqual([
      97, 0, 98, 0, 99, 0, 177, 3, 178, 3, 179, 3, 45, 78, 135, 101, 64,
      216, 135, 220, 64, 216, 137, 220, 64, 216, 204, 220
    ]);

    expect(utfUtils.toUTF16LEBinary(null)).toBeNull();
  });

  it('toUTF16LEHex()', function() {
    expect(utfUtils.toUTF16LEHex('一章　遠子先輩は、美食家です')).toStrictEqual([
      '00', '4E', 'E0', '7A', '00', '30', '60', '90', '50', '5B', '48',
      '51', '29', '8F', '6F', '30', '01', '30', '8E', '7F', 'DF', '98',
      'B6', '5B', '67', '30', '59', '30'
    ]);

    expect(utfUtils.toUTF16LEHex('abcαβγ中文𠂇𠂉𠃌')).toStrictEqual([
      '61', '00', '62', '00', '63', '00', 'B1', '03', 'B2', '03', 'B3',
      '03', '2D', '4E', '87', '65', '40', 'D8', '87', 'DC', '40', 'D8',
      '89', 'DC', '40', 'D8', 'CC', 'DC'
    ]);

    expect(utfUtils.toUTF16LEHex(null)).toBeNull();
  });

  it('toUTF16BEBinary()', function() {
    expect(utfUtils.toUTF16BEBinary('一章　遠子先輩は、美食家です')).toStrictEqual([
      78, 0, 122, 224, 48, 0, 144, 96, 91, 80, 81, 72, 143, 41, 48, 111,
      48, 1, 127, 142, 152, 223, 91, 182, 48, 103, 48, 89
    ]);

    expect(utfUtils.toUTF16BEBinary('abcαβγ中文𠂇𠂉𠃌')).toStrictEqual([
      0, 97, 0, 98, 0, 99, 3, 177, 3, 178, 3, 179, 78, 45, 101, 135, 216,
      64, 220, 135, 216, 64, 220, 137, 216, 64, 220, 204
    ]);

    expect(utfUtils.toUTF16BEBinary(null)).toBeNull();
  });

  it('toUTF16BEHex()', function() {
    expect(utfUtils.toUTF16BEHex('一章　遠子先輩は、美食家です')).toStrictEqual([
      '4E', '00', '7A', 'E0', '30', '00', '90', '60', '5B', '50', '51',
      '48', '8F', '29', '30', '6F', '30', '01', '7F', '8E', '98', 'DF',
      '5B', 'B6', '30', '67', '30', '59'
    ]);

    expect(utfUtils.toUTF16BEHex('abcαβγ中文𠂇𠂉𠃌')).toStrictEqual([
      '00', '61', '00', '62', '00', '63', '03', 'B1', '03', 'B2', '03',
      'B3', '4E', '2D', '65', '87', 'D8', '40', 'DC', '87', 'D8', '40',
      'DC', '89', 'D8', '40', 'DC', 'CC'
    ]);

    expect(utfUtils.toUTF16BEHex(null)).toBeNull();
  });
});
