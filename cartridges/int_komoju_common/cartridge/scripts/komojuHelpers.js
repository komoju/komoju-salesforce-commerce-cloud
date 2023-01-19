
'use Strict';
var service = require('*/cartridge/services/komojuServiceCreateSession');
var Transaction = require('dw/system/Transaction');
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');

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
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.brand);
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'credit_card':
                var expMonth = komojuServiceGetResponseResult.object.payment.payment_details.month;
                var expYear = komojuServiceGetResponseResult.object.payment.payment_details.year;
                var creditCardNumber = komojuServiceGetResponseResult.object.payment.payment_details.last_four_digits;
                var cardType = komojuServiceGetResponseResult.object.payment.payment_details.brand;
                var updatedcardType = cardType.charAt(0).toUpperCase() + cardType.slice(1);
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.brand = komojuServiceGetResponseResult.object.payment.payment_details.brand;
                    paymentInstrument.setCreditCardNumber('********' + creditCardNumber);
                    paymentInstrument.setCreditCardType(updatedcardType);
                    paymentInstrument.setCreditCardExpirationMonth(expMonth);
                    paymentInstrument.setCreditCardExpirationYear(expYear);
                    paymentInstrument.setCreditCardToken(
                        Math.random().toString(36).substr(2)
                    );
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'linepay':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.brand);
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'konbini':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.store = komojuServiceGetResponseResult.object.payment.payment_details.store;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'merpay':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                });
                break;
            case 'bank_transfer':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'payeasy':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'web_money':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    if (komojuServiceGetResponseResult.object.payment.payment_details.prepaid_cards[0] !== undefined) { paymentInstrument.custom.prepaidCardLastDigits = komojuServiceGetResponseResult.object.payment.payment_details.prepaid_cards[0].last_four_digits; }
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'net_cash':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    if (komojuServiceGetResponseResult.object.payment.payment_details.prepaid_cards[0] !== undefined) { paymentInstrument.custom.prepaidCardLastDigits = komojuServiceGetResponseResult.object.payment.payment_details.prepaid_cards[0].last_four_digits; }
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'bit_cache':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'mobile':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'sofortbanking':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'bancontact':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'giropay':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod; paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'ideal':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'paidy':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });

                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod; paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
                });
                break;
            case 'pay_easy':
                Transaction.wrap(function () {
                    var paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
                    var paymentInstrument;
                    Object.keys(paymentInstruments).forEach(function (item) {
                        paymentInstrument = paymentInstruments[item];
                    });
                    paymentInstrument.setCreditCardType(komojuServiceGetResponseResult.object.payment.payment_details.type);
                    paymentInstrument.custom.transactionStatus = transactionStatus;
                    paymentInstrument.custom.komojuPaymentMethodType = paymentMethod;
                    paymentInstrument.custom.komojuPaymentId = komojuServiceGetResponseResult.object.payment.id;
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
 * @param {Object} order local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function failorder(order) {
    var result = { error: false };

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
function deleteBasketIfPresent(currentBaskettemp) {
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
        });
    });
    return currentBaskettemp;
}
/**
 * Delete the basket if present
 * @returns {Object} a plain object of the current site arrayof obnject paymentmethod
 */
function returnArrayOfObj() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var komojuCustomObject = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1);
    var availablePaymentMethods = komojuCustomObject.custom.availableKomojuPaymentMethods;
    var allPaymentMethods = [];
    var jsonavailablePaymentMethods;

    try {
        jsonavailablePaymentMethods = JSON.parse(availablePaymentMethods);
    } catch (e) {
        Logger.error('error in parsing payment methods from site preference availablePaymentMethods ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }
    var allMethods;
    if (jsonavailablePaymentMethods) {
        allMethods = jsonavailablePaymentMethods.c_availablePaymentMethods;
        Object.keys(allMethods).forEach(function (key) {
            var higherobj = allMethods[key];
            Object.keys(higherobj).forEach(function (key1) {
                var method = {};
                var object = higherobj[key1];
                method.id = object.id;
                method.enabled = object.enabled;
                allPaymentMethods.push(method);
            });
        });
    }
    return allPaymentMethods;
}

/**
 * verify the webhook calls
 * @param {Object} body contains the request body
 * @param {string} komojuSignature contains the signature returned by komoju
 * @returns {boolean} a boolean which returns verification
 */
function verifyWebhookCall(body, komojuSignature) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Mac = require('dw/crypto/Mac');
    var cryptoLib = require('dw/crypto');
    var encryptor = new Mac(Mac.HMAC_SHA_256);

    var verified = false;
    var webhooksAuthenticationCode = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.webhooksAuthenticationCode;
    var signatureDigest = encryptor.digest(body, webhooksAuthenticationCode);
    var generatedSignature = cryptoLib.Encoding.toHex(signatureDigest);
    if (generatedSignature === komojuSignature) {
        verified = true;
    }
    return verified;
}
/**
 * creates order with order no.
 * @param {Object} currentBasket contains the request body
 * @param {string} tempOrderNumber contains the temporary orderno returned by  ordermgr class createOrderNo method
 * @returns {order} in the created state
 */
function createOrder(currentBasket, tempOrderNumber) {
    var order;
    if (tempOrderNumber !== '') {
        try {
            order = Transaction.wrap(function () {
                return OrderMgr.createOrder(currentBasket, tempOrderNumber);
            });
        } catch (error) {
            return null;
        }
    } else {
        try {
            order = Transaction.wrap(function () {
                return OrderMgr.createOrder(currentBasket);
            });
        } catch (error) {
            return null;
        }
    }
    return order;
}

module.exports = {
    createSession: CreateSession,
    setinstruments: setinstruments,
    cancelOrder: cancelOrder,
    failorder: failorder,
    undoFail: undoFail,
    deleteBasketIfPresent: deleteBasketIfPresent,
    returnArrayOfObj: returnArrayOfObj,
    verifyWebhookCall: verifyWebhookCall,
    createOrder: createOrder
};
