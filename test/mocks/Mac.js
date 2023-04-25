/* eslint-disable no-unused-vars */
'use strict';

var Mac = function (params) {
    this.type = params;
};
Mac.prototype.digest = function (arg1, arg2) {
    var signature = 'hello';
    return signature;
};
module.exports = Mac;
