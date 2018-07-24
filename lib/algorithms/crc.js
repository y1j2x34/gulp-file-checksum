const crc = require('crc');
const Defer = require('../defer');

module.exports = (type) => {
    const crcalg = crc[type];
    return (file) => {
        if (file.isStream()) {
            const defer = new Defer();
            let previous = 0;
            file.contents.on('data', chunk => {
                previous = crcalg(chunk, previous)
            });
            file.contents.on('end', () => {
                defer.resolve(previous.toString(16));
            });
            file.contents.on('error',defer.reject);
            return defer.promise;
        } else {
            return crcalg(file.contents);
        }
    }
};