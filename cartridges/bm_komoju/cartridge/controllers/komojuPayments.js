'use strict';

/* Script Modules */
/**
 * executes when merchant clicks on komoju payment settings menuaction and renders the toggle page
 */
function start() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var renderHelper = require('../scripts/helpers/renderHelper');
    var Site = require('dw/system/Site');

    var komojuPaymentMethodsFromCustomObject = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.availableKomojuPaymentMethods;
    var komojuSecretKey = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.komojuSecretKey ? CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.komojuSecretKey : '';
    var komojuEmail = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.komojuEmail ? CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.komojuEmail : '';
    var emailToggleValue = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.emailToggleValue ? CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.emailToggleValue : false;
    var webhooksAuthenticationCode = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.webhooksAuthenticationCode ? CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.webhooksAuthenticationCode : '';
    var currentHost = request.httpHost;
    var currentSiteID = Site.getCurrent().ID;
    var komojuWebhooksAsList = [{ event: 'payment.refunded', route: 'HandleWebHooksRefund' }, { event: 'payment.captured', route: 'HandleWebHooksCaptureComplete' }, { event: 'payment.cancelled', route: 'HandleWebHooksCancelled' }, { event: 'payment.expired', route: 'HandleWebHooksExpired' }, { event: 'payment.authorized', route: 'HandleWebHooksPaymentAuthorized' }];
    var komojuPaymentMethodsParsedFromCustomObject;
    var allFetchedMethodsFromCustomObj;
    var komojuMethodNameIdStatus = {};
    var komojuAllDataToBeSent = [];
    var komojuMethodAvailability = false;

    if (komojuPaymentMethodsFromCustomObject) {
        komojuMethodAvailability = true;
        komojuPaymentMethodsParsedFromCustomObject = JSON.parse(komojuPaymentMethodsFromCustomObject);
        allFetchedMethodsFromCustomObj = komojuPaymentMethodsParsedFromCustomObject.c_availablePaymentMethods;
        Object.keys(allFetchedMethodsFromCustomObj).forEach(function (key) {
            var currentMethod = allFetchedMethodsFromCustomObj[key];
            komojuMethodNameIdStatus = {};
            Object.keys(currentMethod).forEach(function (method) {
                var currentMethodData = currentMethod[method];
                komojuMethodNameIdStatus.name = currentMethodData.displayValue.en;
                komojuMethodNameIdStatus.id = currentMethodData.id;
                komojuMethodNameIdStatus.status = currentMethodData.enabled;
                komojuAllDataToBeSent.push(komojuMethodNameIdStatus);
            });
        });
    }


    renderHelper.render('komojuPaymentMethodsList', {
        title: 'KOMOJU Payment Settings',
        CurrentMenuItemId: 'Ordering',
        komojuSecretKey: komojuSecretKey,
        komojuEmail: komojuEmail,
        emailToggleValue: emailToggleValue,
        komojuMethodAvailability: komojuMethodAvailability,
        webhooksAuthenticationCode: webhooksAuthenticationCode,
        currentHost: currentHost,
        currentSiteID: currentSiteID,
        komojuWebhooksAsList: komojuWebhooksAsList,
        komojuAllDataToBeSent: komojuAllDataToBeSent
    });
}

start.public = true;
exports.start = start;
