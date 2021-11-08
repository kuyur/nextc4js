/**
 * @author kuyur@kuyur.info
 */

var fs = require('fs');

function printHelp() {
  console.log('Usage:');
  console.log('  --input or -i: specify input file path of gbk charmap');
  console.log('  --output or -o: specify output file path of gb18030 charmap');
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

// reading GBK charmap (2-bytes characters)
var bufferGBK;
try {
  bufferGBK= fs.readFileSync(input_path);
} catch (error) {
  console.log(error.toString());
  process.exit(1);
}

var text = `0  0x0080
36  0x00A5
38  0x00A9
45  0x00B2
50  0x00B8
81  0x00D8
89  0x00E2
95  0x00EB
96  0x00EE
100  0x00F4
103  0x00F8
104  0x00FB
105  0x00FD
109  0x0102
126  0x0114
133  0x011C
148  0x012C
172  0x0145
175  0x0149
179  0x014E
208  0x016C
306  0x01CF
307  0x01D1
308  0x01D3
309  0x01D5
310  0x01D7
311  0x01D9
312  0x01DB
313  0x01DD
341  0x01FA
428  0x0252
443  0x0262
544  0x02C8
545  0x02CC
558  0x02DA
741  0x03A2
742  0x03AA
749  0x03C2
750  0x03CA
805  0x0402
819  0x0450
820  0x0452
7922  0x2011
7924  0x2017
7925  0x201A
7927  0x201E
7934  0x2027
7943  0x2031
7944  0x2034
7945  0x2036
7950  0x203C
8062  0x20AD
8148  0x2104
8149  0x2106
8152  0x210A
8164  0x2117
8174  0x2122
8236  0x216C
8240  0x217A
8262  0x2194
8264  0x219A
8374  0x2209
8380  0x2210
8381  0x2212
8384  0x2216
8388  0x221B
8390  0x2221
8392  0x2224
8393  0x2226
8394  0x222C
8396  0x222F
8401  0x2238
8406  0x223E
8416  0x2249
8419  0x224D
8424  0x2253
8437  0x2262
8439  0x2268
8445  0x2270
8482  0x2296
8485  0x229A
8496  0x22A6
8521  0x22C0
8603  0x2313
8936  0x246A
8946  0x249C
9046  0x254C
9050  0x2574
9063  0x2590
9066  0x2596
9076  0x25A2
9092  0x25B4
9100  0x25BE
9108  0x25C8
9111  0x25CC
9113  0x25D0
9131  0x25E6
9162  0x2607
9164  0x260A
9218  0x2641
9219  0x2643
11329  0x2E82
11331  0x2E85
11334  0x2E89
11336  0x2E8D
11346  0x2E98
11361  0x2EA8
11363  0x2EAB
11366  0x2EAF
11370  0x2EB4
11372  0x2EB8
11375  0x2EBC
11389  0x2ECB
11682  0x2FFC
11686  0x3004
11687  0x3018
11692  0x301F
11694  0x302A
11714  0x303F
11716  0x3094
11723  0x309F
11725  0x30F7
11730  0x30FF
11736  0x312A
11982  0x322A
11989  0x3232
12102  0x32A4
12336  0x3390
12348  0x339F
12350  0x33A2
12384  0x33C5
12393  0x33CF
12395  0x33D3
12397  0x33D6
12510  0x3448
12553  0x3474
12851  0x359F
12962  0x360F
12973  0x361B
13738  0x3919
13823  0x396F
13919  0x39D1
13933  0x39E0
14080  0x3A74
14298  0x3B4F
14585  0x3C6F
14698  0x3CE1
15583  0x4057
15847  0x4160
16318  0x4338
16434  0x43AD
16438  0x43B2
16481  0x43DE
16729  0x44D7
17102  0x464D
17122  0x4662
17315  0x4724
17320  0x472A
17402  0x477D
17418  0x478E
17859  0x4948
17909  0x497B
17911  0x497E
17915  0x4984
17916  0x4987
17936  0x499C
17939  0x49A0
17961  0x49B8
18664  0x4C78
18703  0x4CA4
18814  0x4D1A
18962  0x4DAF
19043  0x9FA6
33469  0xE76C
33470  0xE7C8
33471  0xE7E7
33484  0xE815
33485  0xE819
33490  0xE81F
33497  0xE827
33501  0xE82D
33505  0xE833
33513  0xE83C
33520  0xE844
33536  0xE856
33550  0xE865
37845  0xF92D
37921  0xF97A
37948  0xF996
38029  0xF9E8
38038  0xF9F2
38064  0xFA10
38065  0xFA12
38066  0xFA15
38069  0xFA19
38075  0xFA22
38076  0xFA25
38078  0xFA2A
39108  0xFE32
39109  0xFE45
39113  0xFE53
39114  0xFE58
39115  0xFE67
39116  0xFE6C
39265  0xFF5F
39394  0xFFE6`;

var arr = text.split('\n');
var offsets = arr.map(line => {
  var parts = line.split('  ');
  return {
    start: +parts[0],
    start_codepoint: Number.parseInt(parts[1], 16)
  };
});

for (var m = 0; m < offsets.length - 1; ++m) {
  offsets[m].end = offsets[m + 1].start - 1;
}
offsets[offsets.length - 1].end = 39419;

var buffer = new Uint8Array(39420 * 2);
var l = 0;
offsets.forEach(offset => {
  for (var j = offset.start, k = 0; j <= offset.end; j++, k++) {
    var codepoint = offset.start_codepoint + k;
    var lowByte = codepoint & 0xFF;
    var highByte = codepoint >>> 8;
    buffer[l++] = lowByte;
    buffer[l++] = highByte;
  }
});

var diff = `A8BC    0x1E3F ḿ
A8BF    0x01F9 ǹ
A989    0x303E 〾
A98A    0x2FF0 ⿰
A98B    0x2FF1 ⿱
A98C    0x2FF2 ⿲
A98D    0x2FF3 ⿳
A98E    0x2FF4 ⿴
A98F    0x2FF5 ⿵
A990    0x2FF6 ⿶
A991    0x2FF7 ⿷
A992    0x2FF8 ⿸
A993    0x2FF9 ⿹
A994    0x2FFA ⿺
A995    0x2FFB ⿻
FE50    0x2E81 ⺁
FE54    0x2E84 ⺄
FE55    0x3473 㑳
FE56    0x3447 㑇
FE57    0x2E88 ⺈
FE58    0x2E8B ⺋
FE5A    0x359E 㖞
FE5B    0x361A 㘚
FE5C    0x360E 㘎
FE5D    0x2E8C ⺌
FE5E    0x2E97 ⺗
FE5F    0x396E 㥮
FE60    0x3918 㤘
FE62    0x39CF 㧏
FE63    0x39DF 㧟
FE64    0x3A73 㩳
FE65    0x39D0 㧐
FE68    0x3B4E 㭎
FE69    0x3C6E 㱮
FE6A    0x3CE0 㳠
FE6B    0x2EA7 ⺧
FE6E    0x2EAA ⺪
FE6F    0x4056 䁖
FE70    0x415F 䅟
FE71    0x2EAE ⺮
FE72    0x4337 䌷
FE73    0x2EB3 ⺳
FE74    0x2EB6 ⺶
FE75    0x2EB7 ⺷
FE77    0x43B1 䎱
FE78    0x43AC 䎬
FE79    0x2EBB ⺻
FE7A    0x43DD 䏝
FE7B    0x44D6 䓖
FE7C    0x4661 䙡
FE7D    0x464C 䙌
FE80    0x4723 䜣
FE81    0x4729 䜩
FE82    0x477C 䝼
FE83    0x478D 䞍
FE84    0x2ECA ⻊
FE85    0x4947 䥇
FE86    0x497A 䥺
FE87    0x497D 䥽
FE88    0x4982 䦂
FE89    0x4983 䦃
FE8A    0x4985 䦅
FE8B    0x4986 䦆
FE8C    0x499F 䦟
FE8D    0x499B 䦛
FE8E    0x49B7 䦷
FE8F    0x49B6 䦶
FE92    0x4CA3 䲣
FE93    0x4C9F 䲟
FE94    0x4CA0 䲠
FE95    0x4CA1 䲡
FE96    0x4C77 䱷
FE97    0x4CA2 䲢
FE98    0x4D13 䴓
FE99    0x4D14 䴔
FE9A    0x4D15 䴕
FE9B    0x4D16 䴖
FE9C    0x4D17 䴗
FE9D    0x4D18 䴘
FE9E    0x4D19 䴙
FE9F    0x4DAE 䶮`;

/*
var diff2 = `A6D9    0xFE10 ︐
A6DA    0xFE12 ︒
A6DB    0xFE11 ︑
A6DC    0xFE13 ︓
A6DD    0xFE14 ︔
A6DE    0xFE15 ︕
A6DF    0xFE16 ︖
A6EC    0xFE17 ︗
A6ED    0xFE18 ︘
A6F3    0xFE19 ︙
FE59    0x9FB4 龴
FE61    0x9FB5 龵
FE66    0x9FB6 龶
FE67    0x9FB7 龷
FE6D    0x9FB8 龸
FE7E    0x9FB9 龹
FE90    0x9FBA 龺
FEA0    0x9FBB 龻`;
*/

var mapping = {};
var arr2 = diff.split('\n');
arr2.forEach(line => {
  var parts = line.replace(/ {4}/g, ' ').split(' ');
  mapping[parseInt(parts[0], 16)] = parseInt(parts[1]);
});

function getOffsetInBuffer(gbCodepoint) {
  gbCodepoint = +gbCodepoint;
  return gbCodepoint - 33088 + 1;
}

// apply the diff of GB18030-2005 / GB18030-2000
for (var key in mapping) {
  var offset = getOffsetInBuffer(key);
  var codepoint = mapping[key];
  var lowByte = codepoint & 0xFF;
  var highByte = codepoint >>> 8;
  bufferGBK[offset * 2] = lowByte;
  bufferGBK[offset * 2 + 1] =  highByte;
}

// remove the file if exists
if (fs.existsSync(output_path)) {
  fs.unlinkSync(output_path);
}

// write GBK buffer (2-bytes characters)
fs.writeFileSync(output_path, bufferGBK, 'binary');

// append other Unicode BMP codepoints (GB18030 0x81308130 ~ 0x8439FE39, 4-bytes characters)
fs.appendFileSync(output_path, buffer, 'binary');

console.log('Charmap ' + output_path + ' is generated.');
