const PluginTemplate = require('../PluginTemplate');
const crypto = require('crypto');

module.exports = function (algorithm) {
    return class HashPlugin extends PluginTemplate {
        static get names () {
            return [algorithm, algorithm.toUpperCase()];
        }
        constructor (file) {
            super(file);
            this.hash = crypto.createHash(algorithm);
        }
        receiveChunk (chunk) {
            this.hash.update(chunk);
        }
        finish () {
            const hex = this.hash.digest('hex');
            const HEX = hex.toUpperCase();
            const result = {};
            result[algorithm] = hex;
            result[algorithm.toUpperCase()] = HEX;
            return result;
        }
    };
};
