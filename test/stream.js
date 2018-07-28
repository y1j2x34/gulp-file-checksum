const fs = require('fs');
const path = require('path');
const mock = require('mock-fs');
const tmp = require('tmp');
const gulp = require('gulp');
const fileChecksum = require('../main');

mock.restore();

describe("test stream", () => {
    let tmpfile,tmpdir ;
    before(() => {
        tmpfile = tmp.fileSync();
        tmpdir = tmp.dirSync();
    });
    after(() => {
        tmpfile.removeCallback();
        tmpdir.removeCallback();
    });
    it('stream', () => {
        gulp.src(tmpfile.name, {
            buffer: false
        })
        .pipe(fileChecksum({
            template: '{md5}',
            output: 'stream_checksum.txt'
        }))
        .pipe(gulp.dest(tmpdir.name))
        .on('end', () => {
            done();
            const from_stream = fs.readFileSync(path.resolve(tmpdir.name, 'stream_checksum.txt')).toString();
            gulp.src(tmpfile, {
                buffer: true
            })
            .pipe(fileChecksum({
                template: '{md5}',
                output: 'buffer_checksum.txt'
            }))
            .pipe(gulp.dest(tmpdir.name))
            .on('end', () => {
                const from_buffer = fs.readFileSync(path.resolve(tmpdir.name, 'buffer_checksum.txt')).toString();
                console.info(from_stream, from_buffer);
                expect(from_stream).to.eql(from_buffer);
                done();
            })
        })
    })
});
