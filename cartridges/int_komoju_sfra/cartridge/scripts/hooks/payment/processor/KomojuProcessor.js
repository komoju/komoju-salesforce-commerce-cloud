var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
/**
 * Creates a token. This should be replaced by utilizing a tokenization provider
 * @returns {string} a token
 */
function createToken() {
    return Math.random().toString(36).substr(2);
}

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @return {Object} returns an error object
 */
function Handle(basket) {
    var cardErrors = {};
    var serverErrors = [];
    Transaction.wrap(function () {
        var paymentInstrument;
        var paymentInstruments;
        if (basket) {
            paymentInstruments = basket.getPaymentInstruments();
            collections.forEach(paymentInstruments, function (item) {
                basket.removePaymentInstrument(item);
            });
            basket.createPaymentInstrument(
                'KOMOJU_HOSTED_PAGE', basket.totalGrossPrice
            );
        }


        paymentInstruments = basket.getPaymentInstruments('KOMOJU_HOSTED_PAGE');

        collections.forEach(paymentInstruments, function (item) {
            paymentInstrument = item;
        });
        paymentInstrument.custom.transactionStatus = 'pending';
    });

    return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        });
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createToken = createToken;
