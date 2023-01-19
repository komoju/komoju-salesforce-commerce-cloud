

'use strict';

var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var customKomojuSourceLogger = Logger.getLogger('customKomojuSourceLogger', 'customKomojuSourceLogger');
var customKomojuErrors = Logger.getLogger('customKomojuErrors', 'customKomojuErrors');

/**
 * execute : to execute the komoju payment method service call
 */
function execute() {
    var komojuHelpers = require('*/cartridge/scripts/komojuHelpers');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var komojuCustomObject = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1);
    var getPaymentMethodService = require('*/cartridge/services/getPaymentMethodService');
    var komojuPaymentMethods;
    var params = {};
    try {
        customKomojuSourceLogger.info('-----KOMOJU getPaymentMethodService API Request Body-----');
        customKomojuSourceLogger.info(JSON.stringify(params));
        komojuPaymentMethods = getPaymentMethodService.KomojuServicePaymentMethod.call(params);
    } catch (e) {
        Logger.error('Error while calling the service getPaymentMethodService ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }
    var methodsTobeStringified = {};
    var komojuMethodContainer = [];
    var i = 0;
    var arrayOfObj = komojuHelpers.returnArrayOfObj();
    var stringified;
    if (komojuPaymentMethods && komojuPaymentMethods.object) {
        customKomojuSourceLogger.info('-----komoju response getPaymentMethodService API Response Body-----');
        customKomojuSourceLogger.info(JSON.stringify(komojuPaymentMethods.object));
        var allPaymentMethods = komojuPaymentMethods.object;
        Object.keys(allPaymentMethods).forEach((method) => {
            if (method) {
                var allFetchedMethods = {};
                var arrayItem = allPaymentMethods[method];
                var object1 = arrayOfObj.find(obj => obj.id === arrayItem.type_slug);
                method = 'method' + (i + 1);
                var currentFetchedMethod = {};
                currentFetchedMethod.id = arrayItem.type_slug;
                currentFetchedMethod.displayValue = {};
                currentFetchedMethod.displayValue.en = arrayItem.name_en;
                currentFetchedMethod.displayValue.ja = arrayItem.name_ja;
                currentFetchedMethod.displayValue.ko = arrayItem.name_ko;

                if (object1) { currentFetchedMethod.enabled = object1.enabled; } else {
                    currentFetchedMethod.enabled = true;
                }
                currentFetchedMethod.currency = arrayItem.currency;
                allFetchedMethods[method] = currentFetchedMethod;
                komojuMethodContainer.push(allFetchedMethods);
                i++;
            }
            methodsTobeStringified.c_availablePaymentMethods = komojuMethodContainer;
            try {
                stringified = JSON.stringify(methodsTobeStringified);
            } catch (e) {
                Logger.error('error in stringifying result from getPaymentMethodService call response  ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
            }
        });
        Transaction.wrap(function () { komojuCustomObject.custom.availableKomojuPaymentMethods = stringified; });
    } else if (komojuPaymentMethods.status === 'SERVICE_UNAVAILABLE') {
        customKomojuErrors.error('getPaymentMethodService API Service is Unavailable: ' + komojuPaymentMethods.unavailableReason);
    } else if (komojuPaymentMethods.error && komojuPaymentMethods.errorMessage) {
        customKomojuErrors.error('getPaymentMethodService  API responded with the following error message: ' + komojuPaymentMethods.errorMessage);
    } else {
        customKomojuErrors.error(' getPaymentMethodService API Service is Unavailable: with no error message');
    }
}
module.exports = { execute: execute };
