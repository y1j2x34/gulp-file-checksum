const fs = require('fs');

const mock = require('mock-fs');
const assert = require('stream-assert');
const Vinyl = require('vinyl');
const gulp = require('gulp');
const chai = require('chai');
const { expect } = chai;

const spies = require('chai-spies');

chai.use(spies);

const fileChecksum = require('../main');

describe('gulp-file-checksum', () => {
    function mockFiles () {
        mock({
            '.nyc_output': {},
            '/mock_home': {
                profile: 'profile content',
                empty: ''
            }
        });
    }

    beforeEach(mockFiles);
    afterEach(mock.restore);

    describe('template syntax', () => {
        it('shoud emit error on unsupported placeholder', done => {
            const spy = chai.spy(function onerror () {});

            gulp.src('/mock_home/profile')
                .pipe(
                    fileChecksum({
                        template: '{md10086}'
                    })
                )
                .on('error', () => {
                    spy();
                    done();
                });
            expect(spy).to.have.been.called;
        });
    });
    it('should ignore null files', done => {
        const stream = fileChecksum({
            template: '{md5}'
        });
        stream.pipe(assert.length(0)).pipe(assert.end(done));
        stream.write(new Vinyl());
        stream.end();
    });
    describe('test stream', () => {
        it('should generates a correct stream', done => {
            gulp.src('/mock_home/profile')
                .pipe(
                    fileChecksum({
                        template: '{md5}'
                    })
                )
                .pipe(assert.length(1))
                .pipe(
                    assert.first(file => {
                        console.info(file.path);
                    })
                )
                .pipe(
                    assert.end(data => {
                        console.info(data);
                        done();
                    })
                );
        });
    });
    describe('placeholders', () => {
        it('should "md5" plugin work correctly', done => {
            gulp.src('/mock_home/profile')
                .pipe(
                    fileChecksum({
                        template: '{md5}',
                        output: '{filename}_checksum.txt'
                    })
                )
                .pipe(gulp.dest('/mock_home/'))
                .pipe(assert.length(1))
                .pipe(
                    assert.end(function () {
                        const profilemd5 = fs
                            .readFileSync('/mock_home/profile_checksum.txt')
                            .toString();
                        expect(profilemd5).to.eql(
                            '7921424f200373ecfe9be345758ebaa4'
                        );
                        done();
                    })
                );
        });
        it('should "crc32" plugin work correctly', done => {
            gulp.src('/mock_home/profile')
                .pipe(
                    fileChecksum({
                        template: '{crc32}',
                        output: '{filename}_checksum.txt'
                    })
                )
                .pipe(gulp.dest('/mock_home/'))
                .pipe(assert.length(1))
                .pipe(
                    assert.end(function () {
                        const profilecrc32 = fs
                            .readFileSync('/mock_home/profile_checksum.txt')
                            .toString();
                        expect(profilecrc32).to.eql('70279111');
                        done();
                    })
                );
        });
        it('size', done => {
            gulp.src('/mock_home/profile')
                .pipe(
                    fileChecksum({
                        template: '{size}',
                        output: '{filename}_checksum.txt'
                    })
                )
                .pipe(gulp.dest('/mock_home/'))
                .pipe(assert.length(1))
                .pipe(
                    assert.end(function () {
                        const realsize = fs.statSync('/mock_home/profile').size;
                        const size = parseInt(
                            fs
                                .readFileSync('/mock_home/profile_checksum.txt')
                                .toString()
                        );
                        expect(size).to.be.eql(realsize);
                        done();
                    })
                );
        });
        it('should "datetime" plugin work correctly', done => {
            gulp.src('/mock_home/profile')
                .pipe(
                    fileChecksum({
                        template: '{datetime}',
                        output: '{filename}_checksum.txt'
                    })
                )
                .pipe(gulp.dest('/mock_home/'))
                .pipe(assert.length(1))
                .pipe(
                    assert.end(function () {
                        const datetimestr = fs
                            .readFileSync('/mock_home/profile_checksum.txt')
                            .toString();
                        const now = new Date()
                            .toLocaleString()
                            .replace(/\b(?=\d\b)/g, '0');
                        expect(datetimestr).to.be.eql(now);
                        done();
                    })
                );
        });
    });

    describe('custom-placeholder', () => {
        const ERROR_MESSAGE = 'should be thrown';
        before(() => {
            fileChecksum.addPlugin(
                class ThrowError {
                    static get names () {
                        return ['throw'];
                    }
                    receiveChunk () {
                        throw new Error(ERROR_MESSAGE);
                    }
                    finish () {}
                }
            );
        });
        it('should throw, when any error thrown in plugin', done => {
            const spy = chai.spy(function (error) {
                expect(error.message).to.be.eql(ERROR_MESSAGE);
                done();
            });
            gulp.src('/mock_home/profile')
                .pipe(
                    fileChecksum({
                        template: '{throw}',
                        output: '{filename}_checksum.txt'
                    })
                )
                .on('error', spy);

            expect(spy).to.be.called;
        });
    });
});
