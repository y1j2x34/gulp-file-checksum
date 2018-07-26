const PluginTemplate = require('../PluginTemplate');

module.exports = class SizePlugin extends PluginTemplate{
    constructor(file) {
        super(file);
        this.filesize = file.stat.size;
    }
    get names() {
        return ['size'];
    }
    finish() {
        return {
            size: this.filesize
        };
    }
};