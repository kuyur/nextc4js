// '\u{1d306}' -> 119558 太玄经字符 𝌆

var chr = 0x1d306;
var m = chr - 0x10000;
var low = m & 0x3FF;
var high = m >> 10;
low += 0xDC00;
high += 0xD800;

var str = String.fromCharCode(high) + String.fromCharCode(low);
str.length; // 2

var str2 = '\u{1d306}';

str === str2; // true

var str3 = String.fromCodePoint(chr);
str === str3; // true
