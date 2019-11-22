const PluginTemplate = require('../PluginTemplate');
const crc = require('crc');

module.exports = type => {
    const crcalg = crc[type];
    return class CRCPlugin extends PluginTemplate {
        static get names () {
            return [type, type.toUpperCase()];
        }
        constructor (file, gulpOptions, placeholder) {
            super(file, gulpOptions, placeholder);
            this.previous = 0;
        }
        receiveChunk (chunk) {
            this.previous = crcalg(chunk, this.previous);
        }
        finish () {
            const hex = this.previous.toString(16);
            const HEX = hex.toUpperCase();
            const result = {};
            result[type] = hex;
            result[type.toUpperCase()] = HEX;
            return result;
        }
    };
};
