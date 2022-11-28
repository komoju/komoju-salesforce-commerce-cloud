

'use strict';

var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

/**
 * execute : to execute the komoju payment method service call
 */
function execute() {
    var getPaymentMethodService = require('int_komoju/cartridge/services/getPaymentMethodService');
    var paymentmethods;
    var params = {};
    try {
        paymentmethods = getPaymentMethodService.KomojuServicePaymentMethod.call(params);
    } catch (e) {
        Logger.error('Error while calling the service getPaymentMethodService ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }
    var object = {};
    var object1 = [];
    var i = 0;
    var stringified;
    if (paymentmethods) {
        var allPaymentMethods = paymentmethods.object;
        Object.keys(allPaymentMethods).forEach((method) => {
            if (method) {
                var higerobj = {};
                var arrayItem = allPaymentMethods[method];
                method = 'method' + (i + 1);
                var lowerobj = {};
                lowerobj.id = arrayItem.type_slug;
                lowerobj.displayValue = {};
                lowerobj.displayValue.en = arrayItem.name_en;
                lowerobj.displayValue.ja = arrayItem.name_ja;
                lowerobj.displayValue.ko = arrayItem.name_ko;
                lowerobj.enabled = true;
                lowerobj.currency = arrayItem.currency;
                higerobj[method] = lowerobj;
                object1.push(higerobj);
                i++;
            }
            object.c_availablePaymentMethods = object1;
            try {
                stringified = JSON.stringify(object);
            } catch (e) {
                Logger.error('error in stringifying result from getPaymentMethodService call response  ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
            }
        });
        Transaction.wrap(function () { Site.getCurrent().setCustomPreferenceValue('availablePaymentMethods', stringified); });
    }
}
module.exports = { execute: execute };
