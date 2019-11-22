// istanbul ignore file
module.exports = class PluginTemplate {
    static get names () {
        throw new Error('The "names" property should be overrided!');
    }
    constructor (file, gulpOptions, placeholder) {
        this.file = file;
        this.gulpOptions = gulpOptions;
        this.placeholder = placeholder;
    }
    preprocess (template) {}
    receiveChunk (chunk) {
        // ignore
    }
    finish () {
        return {};
    }
};
