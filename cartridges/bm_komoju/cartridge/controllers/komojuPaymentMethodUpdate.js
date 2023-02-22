var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');

/**
 *  function to update the payment method
 *
 * */
function updateAvailableMethods() {
    var x = request.httpParameterMap;

    var komojuPaymentMethods = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.availableKomojuPaymentMethods;
    var komojuPaymentMethodsParsed = JSON.parse(komojuPaymentMethods);
    var allKomojuPaymentMethods = komojuPaymentMethodsParsed.c_availablePaymentMethods;

    Object.keys(allKomojuPaymentMethods).forEach(function (key) {
        var currentMethod = allKomojuPaymentMethods[key];
        Object.keys(currentMethod).forEach(function (method) {
            var currentMethodData = currentMethod[method];
            if (currentMethodData.id === x.komojuPaymentMethodId.value) {
                if (x.checked.value === 'true') {
                    currentMethodData.enabled = true;
                } else {
                    currentMethodData.enabled = false;
                }
                return;
            }
        });
    });

    var updatedPaymentMethods = {};
    updatedPaymentMethods.c_availablePaymentMethods = allKomojuPaymentMethods;


    if (CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1)) {
        Transaction.wrap(function () {
            CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.availableKomojuPaymentMethods = JSON.stringify(updatedPaymentMethods);
        });
    }
}


/**
 *  function to update the secret key
 *
 * */
function updateSecretKey() {
    var komojuSecretKey = request.httpParameterMap.komojuSecretKey.value;

    if (komojuSecretKey) {
        Transaction.wrap(function () {
            CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.komojuSecretKey = komojuSecretKey;
        });
    }
}

/**
 *  function to update the secret key
 *
 * */
function updateEmail() {
    var komojuEmail = request.httpParameterMap.komojuEmail.value;
    if (komojuEmail) {
        Transaction.wrap(function () {
            CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.komojuEmail = komojuEmail;
        });
    }
}

/**
 *  function to update the secret key
 *
 * */
function updateAuthenticationCode() {
    var webhooksAuthenticationCode = request.httpParameterMap.webhooksAuthenticationCode.empty ? ' ' : request.httpParameterMap.webhooksAuthenticationCode.value;
    if (webhooksAuthenticationCode) {
        Transaction.wrap(function () {
            CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.webhooksAuthenticationCode = webhooksAuthenticationCode;
        });
    }
}

/**
 *  function to update the secret key
 *
 * */
function updateToggleEmail() {
    var emailToggleValue = request.httpParameterMap.emailToggleValue.value;

    Transaction.wrap(function () {
        if (emailToggleValue === 'true') {
            CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.emailToggleValue = true;
        } else {
            CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.emailToggleValue = false;
        }
    });
}

/**
 *  function to get payment method order from httpParameter Map
 * @return {Object} return payment method json.
 *  @param {Object} object contains the httpParameter Map
 * */
function getCallBackVerificationObject(object) {
    var body = {};
    if (object != null) {
        var parameternames = object.getParameterNames().toArray();
        parameternames.forEach(function (e) {
            body[e] = object.get(e).value;
        });
        delete body.CHECKSUMHASH;
        delete body.csrf_token;
        return body;
    } return false;
}


/**
 *  function to update the availableKomojuPaymentMethods json in order
 *
 **/
function updatePaymentMethodOrder() {
    var allSortedPaymentMethod = request.httpParameterMap;
    var getAllSortedPaymentMethod = getCallBackVerificationObject(allSortedPaymentMethod);
    var currentPaymentMethod;
    var komojuPaymentMethods = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.availableKomojuPaymentMethods;
    var komojuPaymentMethodsParsed = JSON.parse(komojuPaymentMethods);
    var allKomojuPaymentMethods = komojuPaymentMethodsParsed.c_availablePaymentMethods;
    var komojuMethodContainer = [];
    var stringified;
    var i = 0;
    var methodsTobeStringified = {};
    Object.keys(getAllSortedPaymentMethod).forEach(function (key) {
        currentPaymentMethod = allSortedPaymentMethod[key];
        Object.keys(allKomojuPaymentMethods).forEach(function (currentMethodDataKey) {
            var currentMethod = allKomojuPaymentMethods[currentMethodDataKey];
            var method = Object.keys(currentMethod)[0];
            var currentMethodData = currentMethod[method];
            if (currentMethodData.id + currentMethodData.currency === currentPaymentMethod.value) {
                var allFetchedMethods = {};
                method = 'method' + (i + 1);
                allFetchedMethods[method] = currentMethodData;
                komojuMethodContainer.push(allFetchedMethods);
                i++;
            }
        });
    });
    methodsTobeStringified.c_availablePaymentMethods = komojuMethodContainer;
    stringified = JSON.stringify(methodsTobeStringified);
    if (stringified) {
        try {
            Transaction.wrap(function () { CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.availableKomojuPaymentMethods = stringified; });
        } catch (e) {
            Logger.error('error in update custom object attribute availableKomojuPaymentMethods');
        }
    }
}

updatePaymentMethodOrder.public = true;
exports.updatePaymentMethodOrder = updatePaymentMethodOrder;
updateAvailableMethods.public = true;
exports.updateAvailableMethods = updateAvailableMethods;
updateSecretKey.public = true;
exports.updateSecretKey = updateSecretKey;
updateEmail.public = true;
exports.updateEmail = updateEmail;
updateToggleEmail.public = true;
exports.updateToggleEmail = updateToggleEmail;
updateAuthenticationCode.public = true;
exports.updateAuthenticationCode = updateAuthenticationCode;
