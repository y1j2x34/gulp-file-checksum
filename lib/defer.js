// istanbul ignore file
module.exports = class Defer{
    constructor(){
        this.promise = new Promise((onresolve, onreject) => {
            this.resolve = onresolve;
            this.reject = onreject;
        });
    }
}