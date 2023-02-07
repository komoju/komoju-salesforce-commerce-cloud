
'use strict';

/**
 * @namespace Checkout
 */

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Main entry point for Checkout
 */

/**
 * Checkout-Begin : The Checkout-Begin endpoint will render the checkout shipping page for both guest shopper and returning shopper
 * @name Base/Checkout-Begin
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - stage - a flag indicates the checkout stage
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.extend(module.superModule);
server.prepend(
    'Begin',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var OrderMgr = require('dw/order/OrderMgr');
        var currency = req.session.currency.currencyCode;
        var locale = req.locale.id;
        var order;
        if (locale.length > 2) {
            locale = locale.slice(0, 2);
        }
        if (locale !== 'ja' && locale !== 'ko') {
            locale = 'en';
        }

        var requestStage = req.querystring.stage;

        var tempOrderToken = session.privacy.tempOrderToken;
        var tempOrderNumber = session.privacy.tempOrderNumber;

        if (tempOrderNumber && tempOrderToken) {
            order = OrderMgr.getOrder(tempOrderNumber, tempOrderToken);
        }

        var viewData = res.getViewData();


        if (order != null && requestStage === 'submitted' && order.status.displayValue !== 'FAILED') {
            res.redirect(URLUtils.https('KomojuController-KomojuOrder'));
            return next();
        }
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var komojuCustomObject = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1);
        var fetchDisplayName = require('*/cartridge/scripts/fetchDisplayName');
        var availablePaymentMethods = komojuCustomObject.custom.availableKomojuPaymentMethods;
        var allPaymentMethods = [];
        var allMethods;
        var jsonavailablePaymentMethods = null;

        try {
            jsonavailablePaymentMethods = JSON.parse(availablePaymentMethods);
        } catch (e) {
            Logger.error('error in parsing payment methods from custom object ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        }
        if (jsonavailablePaymentMethods != null) {
            allMethods = jsonavailablePaymentMethods.c_availablePaymentMethods;
            Object.keys(allMethods).forEach(function (key) {
                var currentPaymentMethod = allMethods[key];
                Object.keys(currentPaymentMethod).forEach(function (paymentMethodKey) {
                    var method = {};
                    var object = currentPaymentMethod[paymentMethodKey];
                    method.ID = object.id;
                    method.displayName = object.displayValue[locale];
                    if (object.currency !== currency) {
                        if (currency === 'JPY') {
                            method.currency = '(' + Resource.msgf('japanese.currency.msg', 'komojuPayment', null, object.currency) + ')';
                        } else {
                            method.currency = '(' + Resource.msgf('english.currency.msg', 'komojuPayment', null, object.currency) + ')';
                        }
                    } else {
                        method.currency = '';
                    }
                    method.enabled = object.enabled;
                    if (object.enabled !== undefined && object.enabled === true && object.id !== 'credit_card') {
                        allPaymentMethods.push(method);
                    } else if (object.enabled !== undefined && object.enabled === true && object.id === 'credit_card' && object.currency === currency) { allPaymentMethods.push(method); }
                });
            });
        }


        var currentMethodDisplayName;
        if (currentBasket) {
            try {
                var currentMethod = currentBasket.custom.komojuPaymentMethodType;
                currentMethodDisplayName = fetchDisplayName.fetchDisplayName(allMethods, currentMethod, locale);
            } catch (e) {
                Logger.error('No payment method is selected by the customer yet ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
            }
            viewData.allpaymentmethod = allPaymentMethods;
            viewData.selected_method = { selected_method: currentMethodDisplayName };
        }

        return next();
    }
);


module.exports = server.exports();
