module.exports = function(){
    return new Date().toLocaleString().replace(/\b(?=\d\b)/g, '0');
};