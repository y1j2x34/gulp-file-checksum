const path = require('path');
const fs = require('fs');
const tmp = require('tmp');
const through = require('through2');
const PluginError = require('plugin-error');
const package = require('./package.json');
const TemplateParser = require('./lib/Template');
const algorithms = require('./lib/algorithms');
const PLUGIN_NAME = package.name;

const gulpFileChecksum = function gulpFileChecksum(options) {

    const {
        template,
        prefix,
        suffix,
        output
    } = Object.assign(options || {});

    const parser = new TemplateParser(prefix || '{', suffix || '}', true);

    const parsedTemplate = parser.parse(template);

    async function transform(file, enc, cb) {
        // ignore empty files
        if (file.isNull()) {
            return cb();
        }
        let temporary;
        if(file.isStream()) {
            temporary = tmp.fileSync({
                discardDescriptor: true
            });
            file.contents.pipe(fs.createWriteStream(temporary.name))
            await new Promise((resolve, reject) => {
                file.contents.on('error', reject);
                file.contents.on('end', resolve);
            });
        }

        const context = {};
        for (let [key, alg] of Object.entries(algorithms)) {
            Object.defineProperty(context, key, {
                get: () => {
                    if(temporary) {
                        file.contents = fs.createReadStream(temporary.name);
                    }
                    return alg(file, enc)
                }
            });
        }
        
        const result = await parsedTemplate.execute(context, key => {
            throw new PluginError(PLUGIN_NAME, `Unsupported placeholder type: ${key}`);
        });

        if(temporary) {
            temporary.removeCallback();
        }

        if (file.isStream()) {
            const stream = through();
            stream.write(result);
            file.contents = stream;
        } else {
            file.contents = new Buffer(result, enc);
        }

        if (typeof output === 'string') {
            file.path = path.join(file.base, output);
        }

        this.push(file);

        cb();
    }
    return through.obj(transform);
};

function register(type, algorithm) {
    if (typeof handler === 'function') {
        algorithms[type] = algorithm;
    }
}

gulpFileChecksum.register = register;

module.exports = gulpFileChecksum;