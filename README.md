# gulp-file-checksum

[![Build Status](https://travis-ci.org/y1j2x34/gulp-file-checksum.svg?branch=master)](https://travis-ci.org/y1j2x34/gulp-file-checksum)

[![Coverage Status](https://coveralls.io/repos/github/y1j2x34/gulp-file-checksum/badge.svg?branch=master)](https://coveralls.io/github/y1j2x34/gulp-file-checksum?branch=master)

## Installation

Install pakcage with NPM and add it to your development dependencies

`npm install --save-dev gulp-file-checksum`

## Usage

The following generages a file `dist/package_checksum.txt`.

```js
const fileChecksum = require('gulp-file-checksum');
const template = `
MD5     : {md5}
SHA1    : {sha1}
CRC32   : {crc32}
size    : {size} Bytes
Datetime: {dateime}
`
gulp.task('checksum',
    gulp.src('dist/package.zip', {
        buffer: false // for large files
    })
    .pipe(fileChecksum({
        template: template,
        output: '{filename}_checksum.txt'
    }))
    .pipe(gulp.dest('dist'))
)

```

The contents of the checksum file will look like this:

```plain
MD5     : 2f90ce3426541817e0dfd01cae086b60
SHA1    : d817d144dd1397efc52b9ce1dfc9e5713e7265e6
CRC32   : dfc51702
size    : 7051797 Bytes
Datetime: 2018-07-28 21:48:34
```
