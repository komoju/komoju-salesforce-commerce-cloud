'use strict';

/* Script Modules */
/**
 * executes when merchant clicks on komoju payment settings menuaction and renders the toggle page
 */
function start() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var renderHelper = require('../scripts/helpers/renderHelper');
    var Site = require('dw/system/Site');
    var Logger = require('dw/system/Logger');

    var komojuPaymentMethodsFromCustomObjectType;
    try {
        komojuPaymentMethodsFromCustomObjectType = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1) ? CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1) : null;
    } catch (e) {
        Logger.error('The custom object type komojuPaymentMethodsObjectType or the object instance was not found');
    }
    var komojuPaymentMethodsFromCustomObject;
    var komojuSecretKey;
    var komojuEmail;
    var emailToggleValue;
    var webhooksAuthenticationCode;
    var komojuMethodAvailability = false;
    var komojuMetaDataAvailable = false;

    if (komojuPaymentMethodsFromCustomObjectType != null) {
        komojuMetaDataAvailable = true;
        komojuPaymentMethodsFromCustomObject = komojuPaymentMethodsFromCustomObjectType.custom.availableKomojuPaymentMethods;
        komojuSecretKey = komojuPaymentMethodsFromCustomObjectType.custom.komojuSecretKey ? komojuPaymentMethodsFromCustomObjectType.custom.komojuSecretKey : '';
        komojuEmail = komojuPaymentMethodsFromCustomObjectType.custom.komojuEmail ? komojuPaymentMethodsFromCustomObjectType.custom.komojuEmail : '';
        emailToggleValue = komojuPaymentMethodsFromCustomObjectType.custom.emailToggleValue ? komojuPaymentMethodsFromCustomObjectType.custom.emailToggleValue : false;
        webhooksAuthenticationCode = komojuPaymentMethodsFromCustomObjectType.custom.webhooksAuthenticationCode ? komojuPaymentMethodsFromCustomObjectType.custom.webhooksAuthenticationCode : '';
    }
    var currentHost = request.httpHost;
    var currentSiteID = Site.getCurrent().ID;
    var komojuWebhooksAsList = [{ event: 'payment.refunded', route: 'HandleWebHooksRefund' }, { event: 'payment.captured', route: 'HandleWebHooksCaptureComplete' }, { event: 'payment.cancelled', route: 'HandleWebHooksCancelled' }, { event: 'payment.expired', route: 'HandleWebHooksExpired' }, { event: 'payment.authorized', route: 'HandleWebHooksPaymentAuthorized' }];
    var komojuPaymentMethodsParsedFromCustomObject;
    var allFetchedMethodsFromCustomObj;
    var komojuMethodNameIdStatus = {};
    var komojuAllDataToBeSent = [];

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
                komojuMethodNameIdStatus.currency = currentMethodData.currency;
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
        komojuAllDataToBeSent: komojuAllDataToBeSent,
        komojuMetaDataAvailable: komojuMetaDataAvailable
    });
}

start.public = true;
exports.start = start;
