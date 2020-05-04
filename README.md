# gulp-file-checksum [![Build Status](https://travis-ci.org/y1j2x34/gulp-file-checksum.svg?branch=master)](https://travis-ci.org/y1j2x34/gulp-file-checksum) [![Coverage Status](https://coveralls.io/repos/github/y1j2x34/gulp-file-checksum/badge.svg?branch=master)](https://coveralls.io/github/y1j2x34/gulp-file-checksum?branch=master)

## Installation

Install pakcage with NPM and add it to your development dependencies

`npm install --save-dev gulp-file-checksum`

## Usage

### Generate a checksum file

The following generages a file `dist/package_checksum.txt` in the format defined by the template.

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

## Options

- `template` - string

    A template allow users to customize the output format and use placeholder syntax`({})` to define the output content at the specified location.
    The built-in placeholders are as follow:

    1. md5,sha1,sha256,sha512 etc. \- All hash algorithms are provided by [crypto](https://www.npmjs.com/package/crypto)
    2. crc1,crc8,crc24,crc32 etc. \- All crc algorithms are provided by [crc](https://www.npmjs.com/package/crc)
    3. size \- File size in bytes
    4. datetime \- `new Date().toLocaleString()`
    5. run \- Run unix shell commands via [shelljs](https://www.npmjs.com/package/shelljs) and get the results

- `prefix` & `suffix` - string [optional]

    Defines the prefix and suffix of the placeholder in your template.
    Default: `{` and `}`

- `output` - string

    The name of output file. Support these placeholders: `{basename}`, `{extname}`, `{filename}`;

- `plugins` - class

    Sometimes you need to add a custom placeholder in your template, this option allows you to do that like the following example:

    ```js
    // {time:yyyy-MM-dd}
    class FormatedTimePlugin {
        static get names() {
            return ['time'];
        }
        constructor(file, gulpOptions, placeholder) {
            const firstColonIndex = placeholder.indexOf(':');
            if(firstColonIndex > -1) {
                this.format = placeholder.substring(firstColonIndex);
            } else {
                this.format = "YYYY-MM-DDTHH:mm:ss.SSS"; // default format
            }
        }
        preprocess (template) {
            //
        }
        receiveChunk (chunk) {
            // ignore
        }
        finish(){
            return {
                time: someTimeLibray(new Date(), this.format);
            };
        }
    }
    // gulpfile.js
    fileChecksum({
        template: `
        Date: {time:YYYY-MM-DD}
        `.trim(),
        plugins: [FormatedTimePlugin]
    })
    ```
