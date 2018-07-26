const PluginTemplate = require('../PluginTemplate')
module.exports = class DatetimePlugin extends PluginTemplate{
    constructor(file) {
        super(file)
    }
    get names(){
        return ['datetime'];
    }
    finish(){
        return {
            datetime: new Date().toLocaleString().replace(/\b(?=\d\b)/g, '0')
        };
    }
}