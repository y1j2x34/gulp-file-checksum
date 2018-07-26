const gulp = require('gulp');
const checksum = require('./index');

gulp.task('default', () => {
    return gulp
        .src('./macOS High Sierra 10.13.iso', {
            buffer: false
        })
        .pipe(checksum({
            template: `MD5:  {md5}\r\nSHA1: {sha1}\r\nTime: {datetime}\r\nSize: {size} Bytes`,
            output: 'xxx.txt'
        }))
        .pipe(gulp.dest('./temp'))
        ;
});