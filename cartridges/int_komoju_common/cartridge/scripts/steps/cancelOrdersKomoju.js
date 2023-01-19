
'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

var Logger = require('dw/system/Logger');
var customKomojuSourceLogger = Logger.getLogger('customKomojuSourceLogger', 'customKomojuSourceLogger');
var customKomojuErrors = Logger.getLogger('customKomojuErrors', 'customKomojuErrors');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Template = require('dw/util/Template');
var Mail = require('dw/net/Mail');
var HashMap = require('dw/util/HashMap');
var Order = require('dw/order/Order');

/**
 * sendCancelErrorEmail : to send the email to merchant containing the orders which are not updated
 * @param {Object} ordersWhichAreNotUpdated contains the orders
 */
function sendCancelErrorEmail(ordersWhichAreNotUpdated) {
    var template = new Template('cancelAndRefundTemplate');
    let toEmail = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.komojuEmail;

    var mailAttributes = new HashMap();
    mailAttributes.put('allFailedOrders', ordersWhichAreNotUpdated);
    mailAttributes.put('jobProcess', 'Cancel');


    var content = template.render(mailAttributes);

    var mail = new Mail();
    mail.addTo(toEmail);
    mail.setFrom('abcd@xyz.com');
    mail.setSubject('KOMOJU Cancel Orders Error');
    mail.setContent(content);

    mail.send();
}

/**
 * komojuCancelOrder : to cancel the order
 */
function komojuCancelOrder() {
    var komojuService = require('*/cartridge/services/cancelOrderKomoju');

    var bypassChecks = ['Cancelled', 'Refunded', 'Failed', Order.ORDER_STATUS_CANCELLED, Order.PAYMENT_STATUS_NOTPAID];
    var allOrders = OrderMgr.searchOrders('status = {3} AND paymentStatus = {4} AND custom.komojuCancelStatus != {0} AND custom.komojuCancelStatus != {2} AND custom.komojuRefundStatus != {1} AND custom.komojuRefundStatus != {2}', 'orderNo desc', bypassChecks[0], bypassChecks[1], bypassChecks[2], bypassChecks[3], bypassChecks[4]);
    var emailToggleValue = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.emailToggleValue;

    var allOrdersList = allOrders.asList();
    var paymentIdKomoju;
    var cancelResponse;
    var errorOccured = false;
    var ordersWhichAreNotUpdated = [];

    Transaction.wrap(function () {
        for (var i = 0; i < allOrdersList.length; i++) {
            var currentOrder = allOrdersList[i];
            var objectForFailedOrders = {};
            var currentPaymentInstrument = currentOrder.getPaymentInstruments();

            if (currentPaymentInstrument[0] && currentPaymentInstrument[0].paymentMethod && currentPaymentInstrument[0].paymentMethod === 'KOMOJU_HOSTED_PAGE') {
                paymentIdKomoju = currentOrder.custom.komojuPaymentId;
                if (paymentIdKomoju) {
                    try {
                        customKomojuSourceLogger.info('-----cancelOrderKomoju API Request Body-----');
                        customKomojuSourceLogger.info(JSON.stringify(paymentIdKomoju));
                        cancelResponse = komojuService.cancelOrderKomoju.call(paymentIdKomoju);
                    } catch (e) {
                        Logger.error('error in service refundKomoju call ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
                    }
                    if (cancelResponse.status === 'ERROR') {
                        let errorJson;
                        errorOccured = true;
                        objectForFailedOrders.orderNo = currentOrder.orderNo;
                        objectForFailedOrders.totalGrossPrice = currentOrder.totalGrossPrice;
                        objectForFailedOrders.errorMsg = JSON.parse(cancelResponse.errorMessage).error.message;
                        ordersWhichAreNotUpdated.push(objectForFailedOrders);
                        if (cancelResponse.status === 'SERVICE_UNAVAILABLE') {
                            customKomojuErrors.error('cancelOrderKomoju API Service is Unavailable: ' + cancelResponse.unavailableReason);
                            errorJson = JSON.parse(cancelResponse.errorMessage).error.message;
                        } else if (cancelResponse.error && cancelResponse.errorMessage) {
                            customKomojuErrors.error('cancelOrderKomoju  API responded with the following error message: ' + cancelResponse.errorMessage);
                            errorJson = JSON.parse(cancelResponse.errorMessage).error.message;
                        } else {
                            customKomojuErrors.error('Error in cancelOrderKomoju API Response');
                            errorJson = 'Error in cancelOrderKomoju API Response';
                        }
                        currentOrder.custom.komojuCancelResponse = errorJson;
                        currentOrder.custom.komojuCancelStatus = 'Failed';
                    } else {
                        customKomojuSourceLogger.info('-----cancelOrderKomoju komojuServiceCreateSession API Response Body-----');
                        customKomojuSourceLogger.info(JSON.stringify(cancelResponse.object));
                    }
                }
            }
        }
    });
    if (errorOccured && emailToggleValue) {
        sendCancelErrorEmail(ordersWhichAreNotUpdated);
    }
}

module.exports = { komojuCancelOrder: komojuCancelOrder };
