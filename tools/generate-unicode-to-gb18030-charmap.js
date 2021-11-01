/**
 * @author kuyur@kuyur.info
 */

var fs = require('fs');
var decoder = require('../lib/decoder');
var consts = require('../lib/consts');
var condition = require('../lib/condition');

function printHelp() {
  console.log('Usage:');
  console.log('  --input or -i: specify input file path of gb18030 to unicode charmap');
  console.log('  --output or -o: specify output file path of unicode to gb18030 charmap');
}

var args = process.argv.slice(2);
var input_path, output_path;
for (var i = 0; i < args.length; ++i) {
  if (args[i] === '--input' || args[i] === '-i') {
    input_path = args[i+1];
  } else if (args[i] === '--output' || args[i] === '-o') {
    output_path = args[i+1];
  }
}

if (!input_path || !output_path) {
  printHelp();
  process.exit(1);
}

var gb18030Options = {
  'name': 'gb18030-decoder',
  'description': 'GB18030 to Unicode.',
  'version': 'GB18030-2005',
  'type': 'decoder',
  'path': input_path,
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

var charmap = fs.readFileSync(gb18030Options.path);
var gb18030Decoder = new decoder.Multibyte(gb18030Options, new Uint16Array(charmap.buffer));

var u2gb18030 = new Uint32Array(65536);

// ASCII code point
var j = 0;
for (; j <= 0x7F; ++j) {
  u2gb18030[j] = j;
}

// set to unknown char at first
for (j = 0x80; j <= 0xFFFF; ++j) {
  u2gb18030[j] = 0x3F; // 0x3F: ?
}
u2gb18030[0xFFFD] = 0x8431a437;

var chr;
for (j = 0x80; j <= 0xFFFF; ++j) {
  chr = gb18030Decoder.convertChar_(j);
  if (chr !== consts.UNICODE_UNKNOWN_CHAR) {
    if (chr <= 0xFFFF) {
      u2gb18030[chr] = j;
    } else {
      console.error(`Error code point. GB18030 codepoint: ${j}, Unicode codepoint: ${chr}`);
    }
  }
}

var GB18030_4BYTES_UNICODE_BMP = condition.Condition.build(['0x81~0x84', '0x30~0x39', '0x81~0xFE', '0x30~0x39']);
var gb_chr;
for (j = 0; j < 39420; ++j) {
  gb_chr = GB18030_4BYTES_UNICODE_BMP.getCodePoint(j);
  chr = gb18030Decoder.convertChar_(gb_chr);
  if (chr !== consts.UNICODE_UNKNOWN_CHAR) {
    if (chr <= 0xFFFF) {
      u2gb18030[chr] = gb_chr;
    } else {
      console.error(`Error code point. GB18030 codepoint offset: ${j}, codepoint: ${gb_chr}, ` +
        `Unicode codepoint: ${chr}`);
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
var m = 0;
for (var l = 0; l <= 0xFFFF; ++l) {
  var codepoint = u2gb18030[l];
  var firstByte = codepoint & 0xFF;
  codepoint = codepoint >>> 8;
  var secondByte = codepoint & 0xFF;
  codepoint = codepoint >>> 8;
  var thirdByte = codepoint & 0xFF;
  codepoint = codepoint >>> 8;
  var fourthByte = codepoint & 0xFF;
  buffer[m++] = firstByte;
  buffer[m++] = secondByte;
  buffer[m++] = thirdByte;
  buffer[m++] = fourthByte;
}

// remove the file if exists
if (fs.existsSync(output_path)) {
  fs.unlinkSync(output_path);
}

// write to file
fs.writeFileSync(output_path, buffer, 'binary');

console.log('Charmap ' + output_path + ' is generated.');