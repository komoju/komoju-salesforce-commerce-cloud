
'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var Logger = require('dw/system/Logger');
var customKomojuSourceLogger = Logger.getLogger('customKomojuSourceLogger', 'customKomojuSourceLogger');
var customKomojuErrors = Logger.getLogger('customKomojuErrors', 'customKomojuErrors');
var Mail = require('dw/net/Mail');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');


/**
 * sendRefundErrorEmail : to send the email to merchant containing the orders which are not updated
 * @param {Object} ordersWhichAreNotUpdated contains the orders
 */
function sendRefundErrorEmail(ordersWhichAreNotUpdated) {
    var template = new Template('cancelAndRefundTemplate');
    let toEmail = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.komojuEmail;

    var mailAttributes = new HashMap();
    mailAttributes.put('allFailedOrders', ordersWhichAreNotUpdated);
    mailAttributes.put('jobProcess', 'Refund');


    var content = template.render(mailAttributes);

    var mail = new Mail();
    mail.addTo(toEmail);
    mail.setFrom('abcd@xyz.com');
    mail.setSubject('KOMOJU Refund Orders Error');
    mail.setContent(content);

    mail.send();
}

/**
 * upOrder : update order refund status
 */
function refundKomoju() {
    var komojuService = require('*/cartridge/services/refundKomoju');

    var bypassChecks = ['Cancelled', 'Refunded', 'Failed', Order.ORDER_STATUS_CANCELLED, Order.PAYMENT_STATUS_PAID];
    var allOrders = OrderMgr.searchOrders('status = {3} AND paymentStatus = {4} AND custom.komojuCancelStatus != {0} AND custom.komojuCancelStatus != {2} AND custom.komojuRefundStatus != {1} AND custom.komojuRefundStatus != {2}', 'orderNo desc', bypassChecks[0], bypassChecks[1], bypassChecks[2], bypassChecks[3], bypassChecks[4]);

    var emailToggleValue = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1).custom.emailToggleValue;

    var allOrdersList = allOrders.asList();
    var paymentIdKomoju;
    var refundResponse;
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
                        customKomojuSourceLogger.info('-----refundKomoju API Request Body-----');
                        customKomojuSourceLogger.info(JSON.stringify(paymentIdKomoju));
                        refundResponse = komojuService.refundKomoju.call(paymentIdKomoju);
                    } catch (e) {
                        Logger.error('error in service refundKomoju call ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
                    }
                    if (refundResponse.status === 'ERROR') {
                        let errorJson;
                        errorOccured = true;
                        objectForFailedOrders.orderNo = currentOrder.orderNo;
                        objectForFailedOrders.totalGrossPrice = currentOrder.totalGrossPrice;
                        objectForFailedOrders.errorMsg = JSON.parse(refundResponse.errorMessage).error.message;
                        ordersWhichAreNotUpdated.push(objectForFailedOrders);
                        if (refundResponse.status === 'SERVICE_UNAVAILABLE') {
                            customKomojuErrors.error('refundKomoju API Service is Unavailable: ' + refundResponse.unavailableReason);
                            errorJson = JSON.parse(refundResponse.errorMessage).error.message;
                        } else if (refundResponse.error && refundResponse.errorMessage) {
                            customKomojuErrors.error('refundKomoju API responded with the following error message: ' + refundResponse.errorMessage);
                            errorJson = JSON.parse(refundResponse.errorMessage).error.message;
                        } else {
                            customKomojuErrors.error('Error in refundKomoju API Response');
                            errorJson = 'Error in refundKomoju API Response';
                        }
                        currentOrder.custom.komojuRefundResponse = errorJson;
                        currentOrder.custom.komojuRefundStatus = 'Failed';
                    } else {
                        customKomojuSourceLogger.info('-----refundKomoju API Response Body-----');
                        customKomojuSourceLogger.info(JSON.stringify(refundResponse.object));
                    }
                }
            }
        }
    });
    if (errorOccured && emailToggleValue) {
        sendRefundErrorEmail(ordersWhichAreNotUpdated);
    }
}
module.exports = { refundKomoju: refundKomoju };
