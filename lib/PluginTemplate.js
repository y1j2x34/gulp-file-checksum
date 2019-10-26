// istanbul ignore file
module.exports = class PluginTemplate {
    static get names () {
        throw new Error('The "names" property should be overrided!');
    }
    constructor (file) {
        this.file = file;
    }
    receiveChunk (chunk) {
        // ignore
    }
    finish () {
        return {};
    }
};
