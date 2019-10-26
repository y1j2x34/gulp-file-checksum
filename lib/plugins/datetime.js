const PluginTemplate = require('../PluginTemplate');
module.exports = class DatetimePlugin extends PluginTemplate {
    static get names () {
        return ['datetime'];
    }
    constructor (file) {
        super(file);
    }
    finish () {
        return {
            datetime: new Date().toLocaleString().replace(/\b(?=\d\b)/g, '0')
        };
    }
};
