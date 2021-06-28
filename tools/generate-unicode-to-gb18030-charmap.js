var fs = require('fs');
var decoder = require('../lib/nextc4js/decoder');
var consts = require('../lib/nextc4js/consts');
var condition = require('../lib/nextc4js/condition');

var gb18030Options = {
  'name': 'gb18030-decoder',
  'description': 'GB18030 to Unicode.',
  'version': 'GB18030-2005',
  'type': 'decoder',
  'path': '../charmaps/front-gb180302u-little-endian.map',
  'rules': [
    {
      'byte': 1,
      'condition': ['0x00~0x80']
    }, {
      "byte": 1,
      "condition": ["0xFF"]
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

var charmap = fs.readFileSync(gb18030Options.path);
var gb18030Decoder = new decoder.Multibyte(gb18030Options, new Uint16Array(charmap.buffer));

var u2gb18030 = new Uint32Array(65536);

// ASCII code point
var i = 0;
for (; i <= 0x7F; ++i) {
  u2gb18030[i] = i;
}

// set to unknown char at first
for (i = 0x80; i <= 0xFFFF; ++i) {
  u2gb18030[i] = 0x3F; // 0x3F: ?
}
u2gb18030[0xFFFD] = 0x8431a437;

var chr;
for (i = 0x80; i <= 0xFFFF; ++i) {
  chr = gb18030Decoder.convertChar_(i);
  if (chr !== consts.UNICODE_UNKNOWN_CHAR) {
    if (chr <= 0xFFFF) {
      u2gb18030[chr] = i;
    } else {
      console.error(`Error code point. GB18030 codepoint: ${i}, Unicode codepoint: ${chr}`);
    }
  }
}

var GB18030_4BYTES_UNICODE_BMP = condition.Condition.build(['0x81~0x84', '0x30~0x39', '0x81~0xFE', '0x30~0x39']);
var gb_chr;
for (i = 0; i < 39420; ++i) {
  gb_chr = GB18030_4BYTES_UNICODE_BMP.getCodePoint(i);
  chr = gb18030Decoder.convertChar_(gb_chr);
  if (chr !== consts.UNICODE_UNKNOWN_CHAR) {
    if (chr <= 0xFFFF) {
      u2gb18030[chr] = gb_chr;
    } else {
      console.error(`Error code point. GB18030 codepoint offset: ${i}, codepoint: ${gb_chr}, Unicode codepoint: ${chr}`);
    }
  }
}

function codepointToHex(codepoint) {
  return '0x' + codepoint.toString(16).toUpperCase();
}

// validate the code points
var map = {};
for (var k = 0; k < 65536; ++k) {
  if (k < 0xD800 || k > 0xDFFF) { // U+D800 ~ U+DFFF, reserved for UTF-16
    if (k < 0xE000 || k > 0xF8FF) { // U+E000 ~ U+F8FF, private use
      if (!map[u2gb18030[k]]) {
        map[u2gb18030[k]] = {
          count: 1,
          unicode: [k]
        };
      } else {
        map[u2gb18030[k]].count++;
        map[u2gb18030[k]].unicode.push(k);
      }
    }
  }
}

var arr = [];
for (var key in map) {
  if (map[key].count >= 2) {
    console.log(key, map[key].unicode.length, JSON.stringify(map[key].unicode)); // key = 63, GB+3F
    map[key].unicode.forEach(codepoint => {
      arr.push(codepointToHex(codepoint) + ' ' + String.fromCodePoint(codepoint));
    });
  }
}
if (arr.length) {
  console.log(arr.join('\n'));
}

var buffer = new Uint8Array(65536 * 4);
var j = 0;
for (i = 0; i <= 0xFFFF; ++i) {
  var codepoint = u2gb18030[i];
  var firstByte = codepoint & 0xFF;
  codepoint = codepoint >>> 8;
  var secondByte = codepoint & 0xFF;
  codepoint = codepoint >>> 8;
  var thirdByte = codepoint & 0xFF;
  codepoint = codepoint >>> 8;
  var fourthByte = codepoint & 0xFF;
  buffer[j++] = firstByte;
  buffer[j++] = secondByte;
  buffer[j++] = thirdByte;
  buffer[j++] = fourthByte;
}

// remove the file if exists
if (fs.existsSync('../charmaps/back-u2gb18030-little-endian.map')) {
  fs.unlinkSync('../charmaps/back-u2gb18030-little-endian.map');
}

// write to file
fs.writeFileSync('../charmaps/back-u2gb18030-little-endian.map', buffer, 'binary')
