const shelljs = require('shelljs');
const PluginTemplate = require('../PluginTemplate');

module.exports = class ShellCommandPlugin extends PluginTemplate {
    static get names () {
        return ['shell', 'run'];
    }
    constructor (file, gulpOptions, placeholder) {
        super(file, gulpOptions, placeholder);
        const [, commandName] = placeholder.split(':');
        this.command = gulpOptions.shellCommands
            ? gulpOptions.shellCommands[commandName]
            : undefined;
    }
    finish () {
        if (!this.command) {
            return {};
        }
        const result = shelljs.exec(this.command);
        console.info(result.trim().toString());
        return {
            [this.placeholder]: result.trim().toString()
        };
    }
};
