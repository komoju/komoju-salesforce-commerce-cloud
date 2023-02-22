/* eslint-disable no-unused-vars */
'use strict';

var customObjMgr = function () {};
customObjMgr.prototype.getCustomObject = function (arg1, arg2) {
    var obj = {};
    obj.custom = { availableKomojuPaymentMethods: '{"c_availablePaymentMethods":[{"method1":{"id":"konbini","displayValue":{"en":"Konbini","ja":"コンビニ","ko":"편의점"},"enabled":true,"currency":"JPY"}}]}', webhooksAuthenticationCode: 'testcode' };
    return obj;
};
customObjMgr.prototype.getOrderNoBeingEdited = function () {};
customObjMgr.prototype.orderBeingEdited = null;
customObjMgr.prototype.orderNoBeingEdited = null;

module.exports = customObjMgr;
