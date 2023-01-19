'use strict';
var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var collections = require('*/cartridge/scripts/util/collections');

server.extend(module.superModule);
server.prepend(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');

        var Transaction = require('dw/system/Transaction');
        var currentBasket = BasketMgr.getCurrentBasket();
       // var method = req.httpParameterMap.options;
        Transaction.wrap(function () {
            currentBasket.custom.komojuPaymentMethodType = req.httpParameterMap.options;
            var paymentInstruments = currentBasket.getPaymentInstruments();

            collections.forEach(paymentInstruments, function (item) {
                currentBasket.removePaymentInstrument(item);
            });
        });


        return next();
    });


module.exports = server.exports();
