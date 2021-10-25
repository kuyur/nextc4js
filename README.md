# unicue-online
Online version of Unicue, using HTML &amp; JavaScript.

# Build
## Preparation

    npm install
    npm install -g gulp

## Test

    gulp test


# Generate Charmaps

Create a folder called `temp` under `charmaps` and execute:

```bash
# generate cp932 (shift-jis)  to unicode charmap
node ./tools/generate-charmap-generic.js -i ./charmaps/source/front/cp932-1.txt -o ./charmaps/temp/cp932-1.map
node ./tools/generate-charmap-generic.js -i ./charmaps/source/front/cp932-2.txt -o ./charmaps/temp/cp932-2.map
node ./tools/merge-charmaps.js -i1 ./charmaps/temp/cp932-1.map -i2 ./charmaps/temp/cp932-2.map -o ./charmaps/front-jis2u-little-endian.map

# generate cp936 (gbk) to unicode charmap
node ./tools/generate-charmap-generic.js -i ./charmaps/source/front/cp936-1.txt -o ./charmaps/temp/cp936-1.map
node ./tools/generate-charmap-generic.js -i ./charmaps/source/front/cp936-2.txt -o ./charmaps/temp/cp936-2.map
node ./tools/merge-charmaps.js -i1 ./charmaps/temp/cp936-1.map -i2 ./charmaps/temp/cp936-2.map -o ./charmaps/front-gbk2u-little-endian.map

# generate uao2.50 (big5) to unicode charmap
node ./tools/generate-charmap-generic.js -i ./charmaps/source/front/uao250-b2u.txt -o ./charmaps/front-b2u-little-endian.map

# generate cp949 (korean) to unicode charmap
node ./tools/generate-charmap-generic.js -i ./charmaps/source/front/cp949.txt -o ./charmaps/front-kr2u-little-endian.map

# generate cp1251 (cyrillic) to unicode charmap
node ./tools/generate-charmap-generic.js -i ./charmaps/source/front/cp1251.txt -o ./charmaps/front-cyrillic2u-little-endian.map

# generate cp1252 (latin) to unicode charmap
node ./tools/generate-charmap-generic.js -i ./charmaps/source/front/cp1252.txt -o ./charmaps/front-latin2u-little-endian.map

# generate gb18030 to unicode charmap
node ./tools/generate-gb18030-to-unicode-charmap.js -i ./charmaps/front-gbk2u-little-endian.map -o ./charmaps/front-gb180302u-little-endian.map

# generate unicode to gb18030 charmap
node ./tools/generate-unicode-to-gb18030-charmap.js -i ./charmaps/front-gb180302u-little-endian.map -o ./charmaps/back-u2gb18030-little-endian.map
```
