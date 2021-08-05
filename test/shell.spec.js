const fileChecksum = require('../main');
const { expect } = require('chai');
const common = require('./common');
const assert = require('stream-assert');
const ShellCommandPlugin = require('../lib/plugins/shell');

describe('shell command placeholder', () => {
    it('shoud "shell" command plugin work correctly', done => {
        const emptyFile = common.file('');
        emptyFile
            .pipe(
                fileChecksum({
                    template: '{shell:show-revision}',
                    output: '{filename}_checksum.txt',
                    shellCommands: {
                        'show-revision': 'git rev-parse --short HEAD'
                    }
                })
            )
            .pipe(
                assert.first(file => {
                    const revisionInfo = file.contents.toString('utf8');
                    expect(revisionInfo).to.be.string;
                    expect(revisionInfo).to.be.match(/^[0-9a-f]{7}$/);
                })
            )
            .pipe(assert.end(done));
    });
    it('should "shell" command allows empty command', () => {
        const file = common.file('');
        const plugin = new ShellCommandPlugin(file, {}, 'shell:nonexistent');
        expect(() => {
            plugin.finish();
        }).to.not.throw;
    });
});
