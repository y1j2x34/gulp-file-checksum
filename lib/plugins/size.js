const PluginTemplate = require('../PluginTemplate');

module.exports = class SizePlugin extends PluginTemplate {
    static get names () {
        return ['size'];
    }
    constructor (file) {
        super(file);
        this.filesize = file.stat.size;
    }
    finish () {
        return {
            size: this.filesize
        };
    }
};
