const path = require('path');
const fs = require('fs');
const tmp = require('tmp');
const through = require('through2');
const PluginError = require('plugin-error');
const package = require('./package.json');
const TemplateParser = require('./lib/Template');
const Defer = require('./lib/defer');
const PLUGIN_NAME = package.name;

const globalPlugins = require('./lib/plugins');

const OUTPUT_TEMPLATE_PARSER = new TemplateParser('{', '}', true);

const gulpFileChecksum = function gulpFileChecksum(options) {

    const {
        template,
        prefix,
        suffix,
        output,
        plugins
    } = Object.assign(options || {});

    const allPlugins = globalPlugins.concat(plugins || []);

    const parser = new TemplateParser(prefix || '{', suffix || '}', true);

    const parsedTemplate = parser.parse(template);

    const keys = parsedTemplate.keys;

    async function transform(file, enc) {
        if (file.isNull() || file.isDirectory()) {
            return file;
        }
        const pluginInstances = allPlugins
            .map(PluginClass => new PluginClass(file, enc))
            .filter(plugin => 
                plugin.names.reduce((previous, name) => 
                    previous || keys.indexOf(name) > -1, false
                )
            );

        let context;
        if (file.isStream()) {
            context = await transformStream(file, pluginInstances);
        } else {
            context = await transformBuffer(file, pluginInstances);
        }
        const result = await parsedTemplate.execute(context, key => {
            throw new PluginError(PLUGIN_NAME, `Unsupported placeholder type: ${key}`);
        });

        if (file.isStream()) {
            const stream = through();
            stream.write(result);
            file.contents = stream;
        } else {
            file.contents = new Buffer(result, enc);
        }

        if (typeof output === 'string') {
            const basename = path.basename(file.history[0]);
            const extname = path.extname(file.history[0]);
            const filename = basename.slice(0, basename.lastIndexOf(extname));
            const outputname = await OUTPUT_TEMPLATE_PARSER.parse(output).execute({
                basename,
                extname,
                filename
            });
            file.path = path.join(file.base, outputname);
        }
        this.push(file);
        return file;
    }
    return through.obj(async function (file, enc, callback) {
        try {
            file = await transform.call(this, file, enc);
            callback(null, file);
        } catch (error) {
            if(!(error instanceof PluginError)) {
                error = new PluginError(PLUGIN_NAME, error);
            }
            process.nextTick(() => {
                callback(error, file);
            })
        }
    });
};

function transformStream(file, plugins) {
    file.contents.on('data', chunk =>
        plugins.forEach(plugin => plugin.receiveChunk(chunk))
    );
    const defer = new Defer();
    file.contents.on('end', () =>
        defer.resolve(plugins.reduce((previous, plugin) => {
            return mergeFrom(previous, plugin.finish());
        }, {}))
    );
    return defer.promise;
}

function transformBuffer(file, plugins) {
    return plugins.reduce((previous, plugin) => {
        plugin.receiveChunk(file.contents);
        return mergeFrom(previous, plugin.finish());
    }, {});
}

function mergeFrom(dest, src) {
    for (let key in src) {
        dest[key] = src[key];
    }
    return dest;
}

gulpFileChecksum.addPlugin = pluginClass => {
    globalPlugins.push(pluginClass);
}

module.exports = gulpFileChecksum;