'use strict';


var server = require('server');
var Logger = require('dw/system/Logger');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(module.superModule);
server.prepend(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var komojuHelper = require('*/cartridge/scripts/komojuHelpers');
        var BasketMgr = require('dw/order/BasketMgr');
        var URLUtils = require('dw/web/URLUtils');
        var Transaction = require('dw/system/Transaction');
        var currentBasket = BasketMgr.getCurrentBasket();
        var totalGrossPrice = currentBasket.totalGrossPrice.value;
        var UpdatedAmount;
        var currency = req.session.currency.currencyCode;
        var locale = req.locale;
        if (currency === 'USD' || currency === 'EUR') {
            UpdatedAmount = totalGrossPrice * 100;
        } else {
            UpdatedAmount = totalGrossPrice;
        }
        if (locale.id.length > 2) {
            locale = locale.id.slice(0, 2);
        }
        if (locale !== 'ja' && locale !== 'ko') {
            locale = 'en';
        }
        var returnUrl = URLUtils.abs('KomojuController-KomojuOrder');
        var cancelUrl = URLUtils.abs('Checkout-Begin?stage=placeorder');
        var svcResult;
        var method;
        var viewData = res.getViewData();
        method = req.httpParameterMap.options;
        var name = currentBasket.billingAddress.fullName;
        var email = currentBasket.customerEmail;
      //  var type= 'konbini';
        var body = {
            'payment_types[]': method,
            return_url: returnUrl,
            cancel_url: cancelUrl,
            amount: UpdatedAmount,
            currency: currency,
            // payment_data['shipping_address']:'Shinjuku Waseda 2-5-2',
            'payment_data[name]': name,
            email: email,
            default_locale: locale
        };
        var id;
        if (session.privacy.session_id === undefined) {
            session.privacy.session_id = null;
        }
        if (session.privacy.session_id == null || currentBasket.custom.komojuPaymentMethodType !== method) {
            try {
                svcResult = komojuHelper.createSession(body);
            } catch (e) {
                Logger.error('Error while executing the service komojuServiceCreateSession ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
            }
            if (svcResult.object != null) {
                id = svcResult.object.id;
                Transaction.wrap(function () {
                    currentBasket.custom.sessionidkomoju = svcResult.object.id;
                    currentBasket.custom.session_url = svcResult.object.session_url;
                    currentBasket.custom.count = null;
                    currentBasket.custom.komojuPaymentMethodType = method;
                    viewData.error = '';
                });
            } else {
                viewData.error = 'komoju payment error';
                res.json({
                    fieldErrors: [],
                    serverErrors: ['payment method not supported'],
                    error: true
                });
                this.emit('route:Complete', req, res);
                return;
            //    res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'PlaceOrderError', 'service error'));
            //     return next();
            // this need to be removed afterwardsd
            }
        } else {
            id = currentBasket.custom.sessionidkomoju;
        }

        viewData.selected_method = method;

        session.privacy.session_id = id;
        next();
    });

server.append(
      'SubmitPayment',
      server.middleware.https,
      csrfProtection.validateAjaxRequest,
      function (req, res, next) {
          var viewData = res.getViewData();
          if (viewData.error === 'komoju payment error') {
              res.json({
                  fieldErrors: [],
                  serverErrors: ['payment method not supported'],
                  error: true
              });
          }
          return next();
      });


module.exports = server.exports();
