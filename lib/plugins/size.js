const PluginTemplate = require('../PluginTemplate');

module.exports = class SizePlugin extends PluginTemplate {
    static get names () {
        return ['size'];
    }
    constructor (file, gulpOptions, placeholder) {
        super(file, gulpOptions, placeholder);
        this.filesize = file.stat.size;
    }
    finish () {
        return {
            size: this.filesize
        };
    }
};
