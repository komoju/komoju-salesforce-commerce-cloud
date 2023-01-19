var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

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
