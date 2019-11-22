const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const assert = require('stream-assert');
const fileChecksum = require('../main');
const { expect } = require('chai');

describe('shell command placeholder', () => {
    const tempdirname = path.resolve('shell_test_' + Date.now().toString(16));
    const emptyfilename = path.resolve(tempdirname, 'empty');
    before(() => {
        fs.mkdirSync(tempdirname);
        fs.writeFileSync(emptyfilename, '');
    });
    after(() => {
        let rmdirs = filepath => {
            const stat = fs.statSync(filepath);
            if (stat.isFile()) {
                fs.unlinkSync(filepath);
            } else {
                const subfiles = fs.readdirSync(filepath);
                subfiles.forEach(fname =>
                    rmdirs(path.resolve(filepath, fname))
                );
                fs.rmdirSync(filepath);
            }
        };
        rmdirs(tempdirname);
    });
    it('shoud "shell" command plugin work correctly', done => {
        gulp.src(emptyfilename, {
            allowEmpty: true
        })
            .pipe(
                fileChecksum({
                    template: '{shell:show-revision}',
                    output: '{filename}_checksum.txt',
                    shellCommands: {
                        'show-revision': 'git rev-parse --short HEAD'
                    }
                })
            )
            .pipe(gulp.dest(tempdirname))
            .pipe(
                assert.end(() => {
                    const revisionInfo = fs
                        .readFileSync(
                            path.resolve(tempdirname, 'empty_checksum.txt')
                        )
                        .toString();
                    expect(revisionInfo).to.be.string;
                    expect(revisionInfo).to.be.match(/^[0-9a-f]{7}$/);
                    done();
                })
            );
    });
});
