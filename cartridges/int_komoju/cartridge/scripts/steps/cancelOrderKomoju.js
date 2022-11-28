
'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

var Logger = require('dw/system/Logger');

/**
 * komojuCancelOrder : to cancel the order
 */
function komojuCancelOrder() {
    var komojuService = require('int_komoju/cartridge/services/cancelOrderKomoju');

    var komojuCancelStatus = 'Requested';
    var allOrders = OrderMgr.searchOrders('custom.komojuCancelStatus = {0}', 'orderNo desc', komojuCancelStatus);
    var allOrdersList = allOrders.asList();
    var paymentidkomoju;
    var cancelResponse;

    Transaction.wrap(function () {
        for (var i = 0; i < allOrdersList.length; i++) {
            var currentOrder = allOrdersList[i];

            if (currentOrder.paymentInstrument.paymentMethod === 'komoju') {
                paymentidkomoju = currentOrder.custom.paymentidkomoju;
                if (paymentidkomoju) {
                    try {
                        cancelResponse = komojuService.cancelOrderKomoju.call(paymentidkomoju);
                    } catch (e) {
                        Logger.error('error in service refundKomoju call ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
                    }
                    if (cancelResponse.status === 'ERROR') {
                        currentOrder.custom.komojuCancelResponse = JSON.parse(cancelResponse.errorMessage).error.message;
                        currentOrder.custom.komojuCancelStatus = 'Failed';
                    } else {
                        // currentOrder.custom.komojuCancelResponse = 'This order has been successfully cancelled on Komoju Servers';
                        // currentOrder.custom.komojuCancelStatus = 'Initiated';
                    }
                }
            }
        }
    });
}
module.exports = { komojuCancelOrder: komojuCancelOrder };
