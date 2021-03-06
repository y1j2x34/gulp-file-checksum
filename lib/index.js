const path = require('path');
const through = require('through2');
const PluginError = require('plugin-error');
const TemplateParser = require('./Template');
const Defer = require('./defer');

const PLUGIN_NAME = require('../package.json').name;

const globalPlugins = require('./plugins');

const OUTPUT_TEMPLATE_PARSER = new TemplateParser('{', '}', true);

const gulpFileChecksum = function gulpFileChecksum (options) {
    const { template, prefix, suffix, output, plugins } = Object.assign(
        options || {}
    );

    const allPlugins = Object.assign({}, globalPlugins);

    if (plugins) {
        plugins.forEach(PluginClass => {
            PluginClass.names.forEach(name => {
                allPlugins[name] = PluginClass;
            });
        });
    }

    const parser = new TemplateParser(prefix || '{', suffix || '}', true);

    const parsedTemplate = parser.parse(template);

    const keys = parsedTemplate.keys;

    async function transform (file, enc) {
        if (file.isNull() || file.isDirectory()) {
            return null;
        }
        const pluginInstances = keys
            .map(it => {
                let pluginName = it;
                const firstColonIndex = it.indexOf(':');
                if (firstColonIndex > -1) {
                    pluginName = it.slice(0, firstColonIndex);
                }
                const PluginClass = allPlugins[pluginName];
                if (PluginClass) {
                    return new PluginClass(file, options, it);
                }
            })
            .filter(it => !!it);

        pluginInstances.forEach(pluginInstance => {
            if (typeof pluginInstance.preprocess === 'function') {
                pluginInstance.preprocess(parsedTemplate);
            }
        });
        let context;
        if (file.isStream()) {
            context = await transformStream(file, pluginInstances);
        } else {
            context = await transformBuffer(file, pluginInstances);
        }
        const result = await parsedTemplate.execute(context, key => {
            throw new PluginError(
                PLUGIN_NAME,
                `Unsupported placeholder type: ${key}`
            );
        });

        if (file.isStream()) {
            const stream = through();
            stream.write(result);
            file.contents = stream;
            stream.end();
        } else {
            file.contents = Buffer.from(result, enc);
        }

        if (typeof output === 'string') {
            const basename = path.basename(file.history[0]);
            const extname = path.extname(file.history[0]);
            const filename = basename.slice(0, basename.lastIndexOf(extname));
            const outputname = await OUTPUT_TEMPLATE_PARSER.parse(
                output
            ).execute({
                basename,
                extname,
                filename
            });
            file.path = path.join(file.base, outputname);
        }
        this.push(file);
        return file;
    }
    return through.obj(
        async function (file, enc, callback) {
            try {
                file = await transform.call(this, file, enc);
                callback();
            } catch (error) {
                let err = error;
                if (!(error instanceof PluginError)) {
                    err = new PluginError(PLUGIN_NAME, error, {
                        message: error.message,
                        stack: error.stack
                    });
                }
                process.nextTick(() => {
                    callback(err, file);
                });
            }
        },
        function (flush) {
            flush();
        }
    );
};

function transformStream (file, plugins) {
    file.contents.on('data', chunk =>
        plugins.forEach(plugin => plugin.receiveChunk(chunk))
    );
    const defer = new Defer();
    file.contents.on('end', () =>
        defer.resolve(
            plugins.reduce((previous, plugin) => {
                return mergeFrom(previous, plugin.finish());
            }, {})
        )
    );
    return defer.promise;
}

function transformBuffer (file, plugins) {
    return plugins.reduce((previous, plugin) => {
        plugin.receiveChunk(file.contents);
        return mergeFrom(previous, plugin.finish());
    }, {});
}

function mergeFrom (dest, src) {
    for (let key in src) {
        dest[key] = src[key];
    }
    return dest;
}

gulpFileChecksum.addPlugin = pluginClass => {
    pluginClass.names.forEach(name => {
        globalPlugins[name] = pluginClass;
    });
};

module.exports = gulpFileChecksum;
