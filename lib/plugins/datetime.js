const moment = require('moment');
const PluginTemplate = require('../PluginTemplate');
module.exports = class DatetimePlugin extends PluginTemplate {
    static get names () {
        return ['datetime'];
    }
    constructor (file, gulpOptions, placeholder) {
        super(file, gulpOptions, placeholder);
        this.placeholder = placeholder;
        const firstColonIndex = placeholder.indexOf(':');
        if (firstColonIndex > -1) {
            this.format = placeholder.substring(firstColonIndex + 1);
        } else {
            this.format = 'YYYY-MM-DD LTS';
        }
    }
    finish () {
        return {
            [this.placeholder]: moment().format(this.format)
        };
    }
};
