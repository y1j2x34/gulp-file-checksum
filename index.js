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

    async function transform(file, enc, callback) {
        if (file.isNull() || file.isDirectory()) {
            callback();
            return;
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
            file.path = path.join(file.base, output);
        }
        this.push(file);

        callback();
    }
    return through.obj(async function () {
        try {
            return await transform.apply(this, arguments);
        } catch (error) {
            console.error(error);
            this.emit('error', new PluginError(PLUGIN_NAME, error));
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