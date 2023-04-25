'use strict';

class Logger {
    constructor() {
        this.error = function () { return null; };
        this.warn = function () { return null; };
        this.info = function () { return null; };
        this.getLogger = function () { return null; };
    }
}
module.exports = Logger;
