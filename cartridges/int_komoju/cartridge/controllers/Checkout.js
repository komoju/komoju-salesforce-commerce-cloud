
'use strict';

/**
 * @namespace Checkou
 */

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
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
        var locale = req.locale;
        if (locale.id.length > 2) {
            locale = locale.id.slice(0, 2);
        }
        if (locale !== 'ja' && locale !== 'ko') {
            locale = 'en';
        }

     // eslint-disable-next-line no-undef
        var sessionId = session.privacy.session_id;
        var requestStage = req.querystring.stage;
        var productLineItem;
        var billingAddress;
        var viewData = res.getViewData();
        if (currentBasket != null) {
            productLineItem = currentBasket.allProductLineItems.length;
            billingAddress = currentBasket.billingAddress;
        }
        var order = OrderMgr.searchOrder('custom.sessionidkomoju={0}', sessionId);
        if (requestStage !== 'submitted' && order != null && order.custom.done === true && productLineItem === '0' && billingAddress != null) {
            res.redirect(URLUtils.url('Home-Show'));
        }

        if (requestStage !== 'submitted' && order != null && order.paymentInstrument != null && order.paymentInstrument.custom.transaction_status === 'authorized' && productLineItem === '0' && billingAddress != null) {
            res.redirect(URLUtils.url('Home-Show'));
        }


        if (requestStage === 'submitted') {
            res.redirect(URLUtils.https('KomojuController-KomojuOrder', 'session_id', sessionId));
            return next();
        }
        var system = require('dw/system');
        var currentSite = system.Site.getCurrent();
        var availablePaymentMethods = currentSite.getCustomPreferenceValue('availablePaymentMethods');// string of enum  datatype custom atribute on site preferernce systemobject
        var allPaymentMethods = [];
        var jsonAvailablePaymentMethods;

        try {
            jsonAvailablePaymentMethods = JSON.parse(availablePaymentMethods);
        } catch (e) {
            Logger.error('error in parsing payment methods from site preference availablePaymentMethods ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        }
        var allMethods = jsonAvailablePaymentMethods.c_availablePaymentMethods;
        Object.keys(allMethods).forEach(function (key) {
            var higherobj = allMethods[key];
            // var checkcurrency = higherobj['method' + countItem].currency;
            Object.keys(higherobj).forEach(function (key1) {
                var method = {};
                var object = higherobj[key1];
                method.ID = object.id;
                method.displayName = object.displayValue[locale];
                method.currency = object.currency;
                method.enabled = object.enabled;
                if (method.enabled !== undefined && method.enabled === true && method.ID !== 'credit_card') {
                    allPaymentMethods.push(method);
                } else if (method.enabled !== undefined && method.enabled === true && method.ID === 'credit_card' && method.currency === currency) { allPaymentMethods.push(method); }
            });
        });
        if (currentBasket) {
            var currentMethod = currentBasket.custom.komojuPaymentMethodType;
            viewData.allpaymentmethod = allPaymentMethods;
            viewData.selected_method = { selected_method: currentMethod };
        }
        return next();
    }
);


module.exports = server.exports();
