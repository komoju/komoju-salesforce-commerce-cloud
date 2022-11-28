
'use Strict';
var service = require('*/cartridge/services/komojuServiceCreateSession');
var Transaction = require('dw/system/Transaction');
var Status = require('dw/system/Status');
var collections = require('*/cartridge/scripts/util/collections');
var Logger = require('dw/system/Logger');

/**
 * Creates session
 * @param {Object} body local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function CreateSession(body) {
    return service.KomojuService.call(body);
}

/**
 * set instrument
 * @param {Object} komojuServiceGetResponseResult local instance of request object
 * @param {Object} order local instance of request object
 * @returns {Object} a boolean
 */
function setinstruments(komojuServiceGetResponseResult, order) {
    var transactionStatus = komojuServiceGetResponseResult.object.payment.status;
    var paymentMethod = komojuServiceGetResponseResult.object.payment.payment_details.type;
    try {
        switch (paymentMethod) {
            case 'paypay':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.brand);
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'credit_card':
                var expMonth = komojuServiceGetResponseResult.object.payment.payment_details.month;
                var expYear = komojuServiceGetResponseResult.object.payment.payment_details.year;
                var creditCardNumber = komojuServiceGetResponseResult.object.payment.payment_details.last_four_digits;
                var cardType = komojuServiceGetResponseResult.object.payment.payment_details.brand;
                var updatedcardType = cardType.charAt(0).toUpperCase() + cardType.slice(1);// checkoutservices
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                    paymentInstrument.custom.brand = komojuServiceGetResponseResult.object.payment.payment_details.brand;
                    paymentInstrument.setCreditCardNumber('********' + creditCardNumber);
                    paymentInstrument.setCreditCardType(updatedcardType);
                    paymentInstrument.setCreditCardExpirationMonth(expMonth);
                    paymentInstrument.setCreditCardExpirationYear(expYear);
                    paymentInstrument.setCreditCardToken(
                        Math.random().toString(36).substr(2)
                    );
                });
                break;
            case 'linepay':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.brand);
                    paymentInstrument.custom.payment_method = paymentMethod;
                    paymentInstrument.custom.transaction_status = transactionStatus;
                });
                break;
            case 'konbini':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.store = komojuServiceGetResponseResult.object.payment.payment_details.store;
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'merpay':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'bank_transfer':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                    paymentInstrument.custom.bank_name = komojuServiceGetResponseResult.object.payment.payment_details.bank_name;
                    paymentInstrument.custom.order_id = komojuServiceGetResponseResult.object.payment.payment_details.order_id;
                    paymentInstrument.custom.account_type = komojuServiceGetResponseResult.object.payment.payment_details.account_type;
                    paymentInstrument.custom.account_number = komojuServiceGetResponseResult.object.payment.payment_details.account_number;
                });
                break;
            case 'payeasy':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'web_money':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.payment_method = paymentMethod;
                    if (komojuServiceGetResponseResult.object.payment.payment_details.prepaid_cards[0] !== undefined) { paymentInstrument.custom.prepaid_card_last_digits = komojuServiceGetResponseResult.object.payment.payment_details.prepaid_cards[0].last_four_digits; }
                });
                break;
            case 'net_cash':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    if (komojuServiceGetResponseResult.object.payment.payment_details.prepaid_cards[0] !== undefined) { paymentInstrument.custom.prepaid_card_last_digits = komojuServiceGetResponseResult.object.payment.payment_details.prepaid_cards[0].last_four_digits; }
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'bit_cache':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'mobile':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'sofortbanking':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'bancontact':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'giropay':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'ideal':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'paidy':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    collections.forEach(paymentInstruments, function (item) {
                        paymentInstrument = item;
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;
            case 'pay_easy':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('komoju');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });
                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transaction_status = transactionStatus;
                    paymentInstrument.custom.payment_method = paymentMethod;
                });
                break;

            default:
                Logger.warn('the payment method is not configured,kindly contact developer');
        }
    } catch (e) {
        Logger.error('error in transaction for setting payment instrument in the komjuHelper file' + e.fileName + ':' + e.lineNumber);
    }
    return true;
}

/**
 * fail the order
 * @param {Object} serviceresult local instance of request object
 * @param {Object} order local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function failorder(serviceresult, order) {
    var result = { error: false };

    var OrderMgr = require('dw/order/OrderMgr');

    Transaction.wrap(function () {
        var FailOrderStatus = OrderMgr.failOrder(order, true);
        if (FailOrderStatus === Status.ERROR) {
            result.error = true;
            throw new Error();
        }
    });


    return result;
}

/**
 * Cancel order
 * @param {Object} order local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function cancelOrder(order) {
    var result = { error: false };

    var OrderMgr = require('dw/order/OrderMgr');

    Transaction.wrap(function () {
        var FailOrderStatus = OrderMgr.cancelOrder(order);
        if (FailOrderStatus === Status.ERROR) {
            result.error = true;
            throw new Error();
        }


        order.setConfirmationStatus(order.CONFIRMATION_STATUS_NOTCONFIRMED);


        order.setExportStatus(order.EXPORT_STATUS_NOTEXPORTED);
    });


    return result;
}

/**
 * Undo fail
 * @param {Object} order local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function undoFail(order) {
    var result = { error: false };

    var OrderMgr = require('dw/order/OrderMgr');

    Transaction.wrap(function () {
        var FailOrderStatus = OrderMgr.undoFailOrder(order);
        if (FailOrderStatus === Status.ERROR) {
            result.error = true;
            throw new Error();
        }
    });


    return result;
}

/**
 * Delete the basket if present
 * @param {Object} currentBaskettemp local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function deletebasketifpresent(currentBaskettemp) {
    var result = { error: false };
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var productlineitems = currentBaskettemp.getAllProductLineItems();
    var arrayofproductlineitems = productlineitems.toArray();
    arrayofproductlineitems.forEach(function (productitem) {
        var uuid = productitem.getUUID();
        var pid = productitem.getProductID();
        var bonusProductsUUIDs = [];

        Transaction.wrap(function () {
            if (pid && uuid) {
                var productLineItems = currentBaskettemp.getAllProductLineItems(pid);
                var bonusProductLineItems = currentBaskettemp.bonusLineItems;
                var mainProdItem;
                for (var i = 0; i < productLineItems.length; i++) {
                    var item = productLineItems[i];
                    if ((item.UUID === uuid)) {
                        if (bonusProductLineItems && bonusProductLineItems.length > 0) {
                            for (var j = 0; j < bonusProductLineItems.length; j++) {
                                var bonusItem = bonusProductLineItems[j];
                                mainProdItem = bonusItem.getQualifyingProductLineItemForBonusProduct();
                                if (mainProdItem !== null
                                    && (mainProdItem.productID === item.productID)) {
                                    bonusProductsUUIDs.push(bonusItem.UUID);
                                }
                            }
                        }

                        var shipmentToRemove = item.shipment;
                        currentBaskettemp.removeProductLineItem(item);
                        if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                            currentBaskettemp.removeShipment(shipmentToRemove);
                        }
                        break;
                    }
                }
            }
            basketCalculationHelpers.calculateTotals(currentBaskettemp);
        });
    });
    return result;
}
module.exports = {
    createSession: CreateSession,
    setinstruments: setinstruments,
    cancelOrder: cancelOrder,
    failorder: failorder,
    undoFail: undoFail,
    deletebasketifpresent: deletebasketifpresent
};
