const crypto = require('crypto');
const Defer = require('../defer');

module.exports = function (algorithm) {
    return (file) => {
        const hash = crypto.createHash(algorithm);
        if (file.isStream()) {
            const defer = new Defer();
            const stream = file.contents;
            
            stream.on('data', data => {
                hash.update(data);
            });
            stream.on('end', () => {
                defer.resolve(hash.digest('hex'));
            });
            stream.on('error', defer.reject);
            return defer.promise;
        } else {
            hash.update(file.contents);
            return hash.digest('hex');
        }
    };
};