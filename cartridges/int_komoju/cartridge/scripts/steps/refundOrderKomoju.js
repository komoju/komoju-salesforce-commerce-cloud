
'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

var Logger = require('dw/system/Logger');

/**
 * upOrder : update order refund status
 */
function refundKomoju() {
    var komojuService = require('int_komoju/cartridge/services/refundKomoju');

    var komojuRefundStatus = 'Requested';
    var allOrders = OrderMgr.queryOrders('custom.komojuRefundStatus = {0}', 'orderNo asc', komojuRefundStatus);
    var allOrdersList = allOrders.asList();
    var paymentidkomoju;
    var refundResponse;

    Transaction.wrap(function () {
        for (var i = 0; i < allOrdersList.length; i++) {
            var currentOrder = allOrdersList[i];

            if (currentOrder.paymentInstrument.paymentMethod === 'komoju') {
                paymentidkomoju = currentOrder.custom.paymentidkomoju;
                if (paymentidkomoju) {
                    try {
                        refundResponse = komojuService.refundKomoju.call(paymentidkomoju);
                    } catch (e) {
                        Logger.error('error in service refundKomoju call ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
                    }
                    if (refundResponse.status === 'ERROR') {
                        currentOrder.custom.komojuRefundResponse = JSON.parse(refundResponse.errorMessage).error.message;
                        currentOrder.custom.komojuRefundStatus = 'Failed';
                    } else {
                        // currentOrder.custom.komojuRefundResponse = JSON.stringify(refundResponse.object.refunds[0]);
                        // currentOrder.custom.komojuRefundStatus = 'Initiated';
                        // currentOrder.custom.refunded = true;
                    // currentOrder.paymentInstrument.custom.transaction_status = 'refunded';
                    }
                    // currentOrder.custom.komojuRefundRequest = false;
                }
            }
        }
    });
}
module.exports = { refundKomoju: refundKomoju };
