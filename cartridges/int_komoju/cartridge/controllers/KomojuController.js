'use strict';
var server = require('server');

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

server.get('geturl', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
  // eslint-disable-next-line no-shadow
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }

    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }

    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', validationOrderStatus.message));
        return next();
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.no.shipping.address', 'checkout', null)));
        return next();
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.no.billing.address', 'checkout', null)));
        return next();
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }
    var url = currentBasket.custom.session_url;
    var id = currentBasket.custom.sessionidkomoju;

    // Creates a new order.
    var order;
    var orderifpresent = OrderMgr.searchOrder('custom.sessionidkomoju={0}', id);
    if (orderifpresent != null) {
        order = orderifpresent;
    } else {
        order = COHelpers.createOrder(currentBasket);
    }
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }
    Transaction.wrap(function () {
        order.custom.sessionidkomoju = id;
        currentBasket.custom.session_url = url;
        order.custom.count = null;
    });


    res.json({
        sessionURL: url,
        error: false
    });
    return next();
});


server.get('KomojuOrder', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
  // eslint-disable-next-line no-shadow
    var URLUtils = require('dw/web/URLUtils');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var komojuHelper = require('*/cartridge/scripts/komojuHelpers');
    var collections = require('*/cartridge/scripts/util/collections');
    var Order = require('dw/order/Order');
    var result;
    var komojuServiceGetResponse = require('*/cartridge/services/komojuServiceGetResponse');
    var Logger = require('dw/system/Logger');
    var status = null;
    var transactionStatus;
    var paymentId;
    var queryStringSessionId;
    var order;
  // error object
    var success = {
        message: ''
    };
    queryStringSessionId = req.querystring.session_id;
    Logger.warn('warning');

    if (queryStringSessionId) {
        order = OrderMgr.searchOrder('custom.sessionidkomoju = {0}', queryStringSessionId);
        if (order === null || order.custom.done === true) {
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }
    }

    Transaction.wrap(function () {
        if (order) {
            var paymentInstruments = order.getPaymentInstruments(
                'komoju'
            );
            collections.forEach(paymentInstruments, function (item) {
                order.removePaymentInstrument(item);
            });
            order.createPaymentInstrument(
                'komoju', order.totalGrossPrice
            );
        }
    });

    try {
        result = komojuServiceGetResponse.KomojuService.call({ order: order });
    } catch (e) {
        Logger.error('Error while calling the service komojuoServiceGetResponse to get payment detiails of current session ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    Logger.warn(result);
    if (result.error !== 0) {
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'customer', 'PlaceOrderError', 'therer was some error connecting to komoju'));
        return next();
    }


    if (result.object.status === 'pending' && result.object.payment != null) {
        status = 2;
        paymentId = result.object.payment.id;
        komojuHelper.setinstruments(
        result,
        order

    );
        try {
            Transaction.wrap(function () {
                order.custom.paymentidkomoju = paymentId;
            });
        } catch (e) {
            Logger.error('Error while executing the script planConfirmation.js: function updateAccessToken() :: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        }
        transactionStatus = result.object.payment.status;
        komojuHelper.failorder(
        result,
        order

    );
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', 'you returned back form kommoju please go again'));
        return next();
    }
    if (result.object.status === 'pending' && result.object.payment == null) {
        komojuHelper.failorder(
        result,
        order

    );
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', 'you returned back form kommoju please go again'));
        return next();
    }

  // eslint-disable-next-line eqeqeq
    if (result.object.status == 'cancelled') {
        komojuHelper.setinstruments(
            result,
            order

        );

        paymentId = result.object.payment.id;
        status = 1;
    // eslint-disable-next-line camelcase
        transactionStatus = result.object.payment.status;
        if (result.object.payment.status === 'cancelled') {
            success.message = 'You cancelled the order on Komoju so your order is cancelled';
        }
    }
    if (result.object.status === 'completed') {
        komojuHelper.setinstruments(
            result,
            order
        );
        status = 3;
        paymentId = result.object.payment.id;
        transactionStatus = result.object.payment.status;
        if (result.object.payment.status === 'authorized') {
            success.message = 'New Order created successfully and payment authorized . Plz complete  the payment on Komoju';
        } else if (result.object.payment.status === 'captured') {
            success.message = 'Thanks,your Order is placed and payment Captured successfully.';
        }
    }

    // ...........................................................................
    // Handles payment authorization
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);

    // Handle custom processing post authorization
    var options = {
        req: req,
        res: res
    };
    var postAuthCustomizations = hooksHelper('app.post.auth', 'postAuthorization', handlePaymentResult, order, options, require('*/cartridge/scripts/hooks/postAuthorizationHandling').postAuthorization);
    if (postAuthCustomizations && Object.prototype.hasOwnProperty.call(postAuthCustomizations, 'error')) {
        res.json(postAuthCustomizations);
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', postAuthCustomizations));
        return next();
    }

    if (handlePaymentResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }

    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        res.redirect(URLUtils.https('Home-Show'));
        return next();
    }

    // Places the order
  // eslint-disable-next-line eqeqeq, no-unused-vars
    if (status != null && status != 2 && order) {
        if (order.getStatus().value === Order.ORDER_STATUS_FAILED) {
            komojuHelper.undoFail(order);
        }
        var currentBaskettemp = BasketMgr.getCurrentBasket();

        var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
        session.privacy.session_id = null;
        if (!placeOrderResult.error) {
            Transaction.wrap(function () {
                if (result.object.payment.status === 'captured') { order.custom.done = true; }
            });
        }
        if (currentBaskettemp != null) {
            komojuHelper.deletebasketifpresent(currentBaskettemp);
        }
    }


    if (status === 1 && order) {
        var orderStatus = order.getStatus().toString();
        if (orderStatus === 'CREATED' || orderStatus === 'NEW' || orderStatus === 'OPEN') {
            Transaction.wrap(function () {
                var paymentInstrument = order.getPaymentInstruments();
                paymentInstrument[0].custom.transaction_status = transactionStatus;
                order.setPaymentStatus(0);
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            });


            var cancelOrderResult = komojuHelper.cancelOrder(order);
            if (cancelOrderResult.error) {
                res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.technical', 'checkout', null)));
                return next();
            }
        }
    }
    if (req.currentCustomer.addressBook) {
        // save all used shipping addresses to address book of the logged in customer
        var allAddresses = addressHelpers.gatherShippingAddresses(order);
    // eslint-disable-next-line func-names
        allAddresses.forEach(function (address) {
      // eslint-disable-next-line max-len
            if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
        // eslint-disable-next-line max-len
                addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
            }
        });
    }


    if (order.getCustomerEmail()) {
        COHelpers.sendConfirmationEmail(order, req.locale.id);
    }
    try {
        Transaction.wrap(function () {
            order.custom.paymentidkomoju = paymentId;
            if (transactionStatus === 'captured') {
                order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                order.setConfirmationStatus(order.CONFIRMATION_STATUS_CONFIRMED);
            } else if (transactionStatus === 'authorized') {
                order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
            }
        });
    } catch (e) {
        Logger.error('Error while executing the script planConfirmation.js: function updateAccessToken() :: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }


    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);

    // TODO: Exposing a direct route to an Order, without at least encoding the orderID
    //  is a serious PII violation.  It enables looking up every customers orders, one at a
    //  time.
    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');

    if (!order.orderToken || !order.orderNo) {
        res.render('/error', {
            message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });

        return next();
    }


    if (!order || order.customer.ID !== req.currentCustomer.raw.ID
    ) {
        res.render('/error', {
            message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });

        return next();
    }
    var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
    if (lastOrderID === req.querystring.ID) {
        res.redirect(URLUtils.url('Home-Show'));
        return next();
    }

    var config = {
        numberOfLineItems: '*'
    };

    var currentLocale = Locale.getLocale(req.locale.id);

    var orderModel = new OrderModel(
        order,
        { config: config, countryCode: currentLocale.country, containerView: 'order' }
    );
    var passwordForm;
    var customObject = {};
    customObject.payment_method = order.paymentInstrument.custom.payment_method;
    var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);

    if (!req.currentCustomer.profile) {
        passwordForm = server.forms.getForm('newPasswords');
        passwordForm.clear();
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: false,
            passwordForm: passwordForm,
            reportingURLs: reportingURLs,
            orderUUID: order.getUUID(),
            customobject: customObject,
            success: success
        });
    } else {
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: true,
            reportingURLs: reportingURLs,
            orderUUID: order.getUUID(),
            success: success
        });
    }
    req.session.raw.custom.orderID = req.querystring.ID; // eslint-disable-line no-param-reassign
    return next();
}
);
server.post('HandleWebHooksRefund', function (req, res, next) {
    var reqdata;
    var body;
    body = JSON.parse(req.body);
    reqdata = JSON.parse(req.body).data.id;

    var komojuOrder = OrderMgr.searchOrder('custom.paymentidkomoju = {0}', reqdata);

    Transaction.wrap(function () {
        if (komojuOrder) {
            var paymentInstrument = komojuOrder.getPaymentInstruments();
            paymentInstrument[0].custom.transaction_status = body.data.status;
            komojuOrder.setPaymentStatus(0);
            komojuOrder.custom.komojuRefundStatus = 'Refunded';
            komojuOrder.custom.komojuRefundResponse = 'Amount is successfully refunded.';
        }
    });
    res.json({ data: true });
    return next();
});
server.post('HandleWebHooksCaptureComplete', function (req, res, next) {
    var reqdata = JSON.parse(req.body).data.id;
    var body = JSON.parse(req.body);
    var Order = require('dw/order/Order');
    var paymentInstrument;
    var orderStatus;
    var komojuOrder = OrderMgr.searchOrder('custom.paymentidkomoju = {0}', reqdata);
    if (komojuOrder) {
        orderStatus = komojuOrder.getStatus().toString();
    }
    Transaction.wrap(function () {
        if (orderStatus === 'CREATED' && komojuOrder) {
            OrderMgr.placeOrder(komojuOrder);
            paymentInstrument = komojuOrder.getPaymentInstruments();
            paymentInstrument[0].custom.transaction_status = body.data.status;
            komojuOrder.setPaymentStatus(2);
            komojuOrder.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            komojuOrder.setExportStatus(Order.EXPORT_STATUS_READY);
        } else {
            paymentInstrument = komojuOrder.getPaymentInstruments();
            paymentInstrument[0].custom.transaction_status = body.data.status;
            komojuOrder.setPaymentStatus(2);
        }
    });
    res.json({ data: true });
    return next();
});
server.post('HandleWebHooksCancelled', function (req, res, next) {
    var reqdata = JSON.parse(req.body).data.id;
    var body = JSON.parse(req.body);

    var komojuOrder = OrderMgr.searchOrder('custom.paymentidkomoju = {0}', reqdata);
    if (komojuOrder) {
        var orderStatus = komojuOrder.getStatus().toString();
        Transaction.wrap(function () {
            if (orderStatus === 'CREATED' || orderStatus === 'NEW' || orderStatus === 'OPEN' || orderStatus === 'FAILED') {
                OrderMgr.cancelOrder(komojuOrder);
                var paymentInstrument = komojuOrder.getPaymentInstruments();
                paymentInstrument[0].custom.transaction_status = body.data.status;
                komojuOrder.setPaymentStatus(0);
                komojuOrder.custom.komojuCancelStatus = 'Cancelled';
                komojuOrder.custom.komojuCancelResponse = 'This order has been successfully cancelled on Komoju Servers';
            }
        });
    }
    res.json({ data: true });
    return next();
});

server.post('HandleWebHooksexpired', function (req, res, next) {
    var reqdata = JSON.parse(req.body).data.id;
    // var reqdata=session.custom.reqdata;
    var body = JSON.parse(req.body);

    var komojuOrder = OrderMgr.searchOrder('custom.paymentidkomoju = {0}', reqdata);
    if (komojuOrder) {
        var orderStatus = komojuOrder.getStatus().toString();
        Transaction.wrap(function () {
            if (orderStatus === 'CREATED' || orderStatus === 'NEW' || orderStatus === 'OPEN') {
                OrderMgr.cancelOrder(komojuOrder);
                var paymentInstrument = komojuOrder.getPaymentInstruments();
                paymentInstrument[0].custom.transaction_status = body.data.status;
                komojuOrder.setPaymentStatus(2);
            }
        });
    }
    res.json({ data: true });
    return next();
});


server.post('HandleWebHooksPaymentAuthorized', function (req, res, next) {
    var reqdata = JSON.parse(req.body).data.session;
    var komojuOrder = OrderMgr.searchOrder('custom.sessionidkomoju = {0}', reqdata);
    var sessionId = komojuOrder.custom.sessionidkomoju;
    res.redirect(URLUtils.https('KomojuController-KomojuOrder', 'session_id', sessionId));


    res.json({ data: true });
    return next();
});
server.post('handleSfccRefundRequest', function (req, res, next) {
    var response = { data: null };
    var body = JSON.parse(req.body);
    var orderid = body.data.orderid;

    var order = OrderMgr.getOrder(orderid);
    if (order != null && order.custom.refunded === false) {
        Transaction.wrap(function () {
            order.custom.komojuRefundRequest = true;
        });
    } else {
        response.data = 'already refunded or in process ';
    }
    res.json(response);
    return next();
});


module.exports = server.exports();
