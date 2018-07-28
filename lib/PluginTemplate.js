// istanbul ignore file
module.exports = class PluginTemplate {
    constructor(file) {
        this.file = file;
    }
    receiveChunk(chunk) {
        // ignore
    }
    get names() {
        return [];
    }
    finish() {
        return {};
    }
}