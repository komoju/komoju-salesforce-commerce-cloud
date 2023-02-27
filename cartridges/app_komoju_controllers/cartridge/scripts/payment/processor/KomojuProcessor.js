'use strict';
var Cart = require('*/cartridge/scripts/models/CartModel');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Handle method is used for creating payment instrument.
 * @param {Object} args contain basket and payment method id
 * @return {Object} return status
 */
function Handle(args) {
    var cart = Cart.get(args.Basket);
    Transaction.wrap(function () {
        cart.removeExistingPaymentInstruments('KOMOJU_HOSTED_PAGE');
        cart.createPaymentInstrument('KOMOJU_HOSTED_PAGE', cart.getNonGiftCertificateAmount());
    });

    return { success: true };
}

/**
 * Authorizes a payment.
 * only and setting the order no as the transaction ID.
 * @param {Object} args contains order, order no and payment instrument.
 * @return {Object} return status
 */
function Authorize(args) {
    var orderNo = args.OrderNo;
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNo;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    return { authorized: true };
}

/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;
