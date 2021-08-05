const Vinyl = require('vinyl');
const array = require('stream-array');
const path = require('path');

exports.file = function (...contents) {
    let i = 0;
    function create (content) {
        return new Vinyl({
            cwd: __dirname,
            base: __dirname,
            path: path.resolve(__dirname, 'tmp-' + i++),
            contents:
                typeof content === 'string'
                    ? Buffer.from(content, { encoding: 'utf8' })
                    : content
        });
    }
    return array(contents.map(it => create(it)));
};
