const Defer = require('../defer');
module.exports = function(file) {
    if(file.isStream()) {
        return file.stat.size;
    } else {
        return file.contents.length;
    }
};