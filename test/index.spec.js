const fs = require('fs');
const moment = require('moment');
const assert = require('stream-assert');
const Vinyl = require('vinyl');
const chai = require('chai');
const common = require('./common');
const { expect } = chai;

const spies = require('chai-spies');

chai.use(spies);
const TEST_FILE_CONTENT = 'profile content';

function test () {
    return common.file(TEST_FILE_CONTENT);
}

describe('gulp-file-checksum', () => {
    const fileChecksum = require('../main');

    afterEach(() => {
        if (fs.existsSync('/mock_home/profile_checksum.txt')) {
            fs.unlinkSync('/mock_home/profile_checksum.txt');
        }
        if (fs.existsSync('/.nyc_output')) {
            fs.renameSync(
                '/.nyc_output',
                Math.floor(Math.random() * Date.now()).toString(16)
            );
            fs.mkdirSync('/.nyc_output');
        }
    });

    describe('template syntax', () => {
        it('shoud emit error on unsupported placeholder', done => {
            const spy = chai.spy(function onerror () {});
            test()
                .pipe(
                    fileChecksum({
                        template: '{md10086}'
                    })
                )
                .on('error', e => {
                    spy(e);
                })
                .pipe(
                    assert.end(() => {
                        expect(spy).to.have.been.called;
                        done();
                    })
                );
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
    describe('placeholders', () => {
        it('should "md5" plugin work correctly', done => {
            test()
                .pipe(
                    fileChecksum({
                        template: '{md5}',
                        output: '{filename}_checksum.txt'
                    })
                )
                .pipe(
                    assert.first(file => {
                        console.info(file);
                        const checksum = file.contents.toString('utf8');
                        expect(checksum).to.be.eql(
                            '7921424f200373ecfe9be345758ebaa4'
                        );
                    })
                )
                .pipe(assert.end(done));
        });
        it('should "crc32" plugin work correctly', done => {
            test()
                .pipe(
                    fileChecksum({
                        template: '{crc32}',
                        output: '{filename}_checksum.txt'
                    })
                )
                .pipe(assert.length(1))
                .pipe(
                    assert.first(function (file) {
                        const checksum = file.contents.toString('utf8');
                        console.info(checksum);
                        expect(checksum).to.be.eql('70279111');
                    })
                )
                .pipe(assert.end(done));
        });
        it('should "size" plugin work correctly', done => {
            test()
                .pipe(
                    fileChecksum({
                        template: '{size}',
                        output: '{filename}_checksum.txt'
                    })
                )
                .pipe(assert.length(1))
                .pipe(
                    assert.first(function (file) {
                        const realsize = TEST_FILE_CONTENT.length;
                        const size = parseInt(file.contents.toString('utf8'));
                        expect(size).to.be.eql(realsize);
                    })
                )
                .pipe(assert.end(done));
        });
        it('should "datetime" plugin work correctly', done => {
            const nowDatetime = new Date();
            const OriginDate = Date;
            global.Date = class extends OriginDate {
                constructor () {
                    if (arguments.length === 0) {
                        return nowDatetime;
                    }
                    super(...arguments);
                }
            };
            test()
                .pipe(
                    fileChecksum({
                        template: '{datetime}',
                        output: '{filename}_checksum.txt'
                    })
                )
                .pipe(assert.length(1))
                .pipe(
                    assert.first(function (file) {
                        const datetimestr = file.contents.toString('utf8');
                        const now = moment(nowDatetime).format(
                            'YYYY-MM-DD LTS'
                        );
                        expect(datetimestr).to.be.eql(now);
                        global.Date = OriginDate;
                    })
                )
                .pipe(assert.end(done));
        });
        it('should "datetime" plugin properly format the Date object', done => {
            const nowDatetime = new Date();
            const OriginDate = Date;
            global.Date = class extends OriginDate {
                constructor () {
                    if (arguments.length === 0) {
                        return nowDatetime;
                    }
                    super(...arguments);
                }
            };
            test()
                .pipe(
                    fileChecksum({
                        template: '{datetime:YYYY-MM-DD HH:mm:ss}',
                        output: '{filename}_checksum.txt'
                    })
                )
                .pipe(assert.length(1))
                .pipe(
                    assert.first(function (file) {
                        const datetimestr = file.contents.toString('utf8');
                        const now = moment(nowDatetime).format(
                            'YYYY-MM-DD HH:mm:ss'
                        );
                        expect(datetimestr).to.be.eql(now);
                        global.Date = OriginDate;
                    })
                )
                .pipe(assert.end(done));
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
            });
            test()
                .pipe(
                    fileChecksum({
                        template: '{throw}',
                        output: '{filename}_checksum.txt'
                    })
                )
                .on('error', spy)
                .pipe(
                    assert.end(() => {
                        expect(spy).to.be.called;
                        done();
                    })
                );
        });
        it('should parse the custom placeholder correctly', done => {
            test()
                .pipe(
                    fileChecksum({
                        template: `{time:YYYY-MM-DD HH:mm:ss A}`,
                        output: '{filename}_checksum.txt',
                        plugins: [
                            class CustomTimePlugin {
                                static get names () {
                                    return ['time'];
                                }
                                constructor (file, gulpOptions, placeholder) {
                                    this.placeholder = placeholder;
                                    const firstColonIndex = placeholder.indexOf(
                                        ':'
                                    );
                                    if (firstColonIndex > -1) {
                                        this.format = placeholder.substring(
                                            firstColonIndex + 1
                                        );
                                    } else {
                                        this.format = 'YYYY-MM-DDTHH:mm:ss.SSS'; // default format
                                    }
                                }
                                preprocess (template) {
                                    //
                                }
                                receiveChunk (chunk) {
                                    // ignore
                                }
                                finish () {
                                    return {
                                        [this.placeholder]: moment(
                                            1588609103564
                                        )
                                            .utcOffset(0)
                                            .format(this.format)
                                    };
                                }
                            }
                        ]
                    })
                )
                .pipe(assert.length(1))
                .pipe(
                    assert.first(function (file) {
                        const datetimestr = file.contents.toString();
                        expect(datetimestr).to.be.eql('2020-05-04 16:18:23 PM');
                    })
                )
                .pipe(assert.end(done));
        });
    });
});
