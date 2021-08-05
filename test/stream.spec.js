const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const gulp = require('gulp');
const fileChecksum = require('../main');
const chai = require('chai');
const { expect } = chai;

describe('test stream', () => {
    let tmpfile, tmpdir, streamChecksum, bufferChecksum;
    before(() => {
        tmpfile = tmp.fileSync();
        tmpdir = tmp.dirSync();
        streamChecksum = path.resolve(tmpdir.name, 'streamChecksum.txt');
        bufferChecksum = path.resolve(tmpdir.name, 'bufferChecksum.txt');
    });
    after(() => {
        tmpfile.removeCallback();
        fs.unlinkSync(streamChecksum);
        fs.unlinkSync(bufferChecksum);
        tmpdir.removeCallback();
    });
    it('stream', done => {
        fs.writeFileSync(tmpfile.name, Buffer.from('file content', 'utf8'));
        gulp.src(tmpfile.name, {
            buffer: false
        })
            .pipe(
                fileChecksum({
                    template: '{md5}',
                    output: 'streamChecksum.txt'
                })
            )
            .on('error', console.error)
            .pipe(gulp.dest(tmpdir.name))
            .on('end', () => {
                const fromStream = fs.readFileSync(streamChecksum).toString();
                gulp.src(tmpfile.name, {
                    buffer: true
                })
                    .pipe(
                        fileChecksum({
                            template: '{md5}',
                            output: 'bufferChecksum.txt'
                        })
                    )
                    .pipe(gulp.dest(tmpdir.name))
                    .on('end', () => {
                        const fromBuffer = fs
                            .readFileSync(bufferChecksum)
                            .toString();
                        expect(fromStream).to.eql(fromBuffer);
                        done();
                    });
            });
    });
});
