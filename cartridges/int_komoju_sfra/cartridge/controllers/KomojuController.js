'use strict';
var server = require('server');

var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var komojuHelpers = require('*/cartridge/scripts/komojuHelpers');
var fetchDisplayName = require('*/cartridge/scripts/fetchDisplayName');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Logger = require('dw/system/Logger');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var customKomojuErrors = Logger.getLogger('customKomojuErrors', 'customKomojuErrors');
server.get('geturl', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var collections = require('*/cartridge/scripts/util/collections');
    var customKomojuSourceLogger = Logger.getLogger('customKomojuSourceLogger', 'customKomojuSourceLogger');
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
    var sessionId;
    var sessionUrl;
    var tempOrderNumber;
    Transaction.wrap(function () { tempOrderNumber = OrderMgr.createOrderNo(); });
    session.privacy.tempOrderNumber = tempOrderNumber;
    var totalGrossPrice = currentBasket.totalGrossPrice.value;
    var UpdatedAmount;
    var currency = req.session.currency.currencyCode;
    var locale = req.locale.id;
    var noCentCurrency = [
        'DIF', 'CLP', 'BIF',
        'GNF', 'JPY', 'KMF',
        'KRW', 'MGA', 'PYG',
        'RWF', 'UGX', 'VND',
        'VUV', 'XAF', 'XOF',
        'XPF'];
    if (noCentCurrency.includes(currency)) {
        UpdatedAmount = totalGrossPrice;
    } else {
        UpdatedAmount = totalGrossPrice * 100;
    }
    if (locale.length > 2) {
        locale = locale.slice(0, 2);
    }
    if (locale !== 'ja' && locale !== 'ko') {
        locale = 'en';
    }
    var returnUrl = URLUtils.abs('KomojuController-KomojuOrder');
    // what to do for this komoju does not support cancel url functionality
    var cancelUrl = URLUtils.abs('Checkout-Begin?stage=placeorder');
    var komojuCreateSessionResult;
    var komojuCancelSessionResult;
    var komojuExchangeRate;
    var previousSessionId;
    var method;
    var viewData = res.getViewData();

    method = currentBasket.custom.komojuPaymentMethodType;

    var name = currentBasket.billingAddress.fullName;
    var email = currentBasket.customerEmail;
    var address1 = currentBasket.shipments[0].shippingAddress.address1;
    var address2 = currentBasket.shipments[0].shippingAddress.address2;
    var postalCode = currentBasket.shipments[0].shippingAddress.postalCode;
    var city = currentBasket.shipments[0].shippingAddress.city;
    var country = currentBasket.shipments[0].shippingAddress.countryCode.displayValue;
    var body = {
        'payment_types[]': method,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        amount: UpdatedAmount,
        currency: currency,
        email: email,
        'payment_data[shipping_address][zipcode]': postalCode,
        'payment_data[shipping_address][street_address1]': address1,
        'payment_data[shipping_address][street_address2]': address2,
        'payment_data[shipping_address][country]': country,
        'payment_data[shipping_address][city]': city,
        'payment_data[name]': name,
        'payment_data[external_order_num]': tempOrderNumber,
        default_locale: locale
    };

    if (session.privacy.session_id) {
        previousSessionId = session.privacy.session_id;
        try {
            komojuCancelSessionResult = komojuHelpers.cancelSession(previousSessionId);
        } catch (e) {
            Logger.error('Error while executing the service komojuServiceCancelSession ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        }
        if (komojuCancelSessionResult.status === 'OK') {
            session.privacy.session_id = null;
        }
    }
    try {
        customKomojuSourceLogger.info('-----KOMOJU sessioncreate API Request Body-----');
        customKomojuSourceLogger.info(JSON.stringify(body));
        komojuCreateSessionResult = komojuHelpers.createSession(body);
    } catch (e) {
        Logger.error('Error while executing the service komojuServiceCreateSession ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }
    if (komojuCreateSessionResult.object != null) {
        customKomojuSourceLogger.info('-----komoju response komojuServiceCreateSession API Response Body-----');
        customKomojuSourceLogger.info(JSON.stringify(komojuCreateSessionResult.object));
        sessionId = komojuCreateSessionResult.object.id;
        sessionUrl = komojuCreateSessionResult.object.session_url;
        komojuExchangeRate = parseFloat((komojuCreateSessionResult.object.payment_methods[0].exchange_rate).toFixed(4));
        Transaction.wrap(function () {
            currentBasket.custom.komojuSessionId = sessionId;
            currentBasket.custom.komojuSessionUrl = sessionUrl;
            session.privacy.session_id = sessionId;
            viewData.error = '';
            session.privacy.prevTotalGrossPrice = currentBasket.totalGrossPrice.value;
        });
    } else {
        if (komojuCreateSessionResult.status === 'SERVICE_UNAVAILABLE') {
            customKomojuErrors.error('komojuservicecreatesession API Service is Unavailable: ' + komojuCreateSessionResult.unavailableReason);
        } else if (komojuCreateSessionResult.error && komojuCreateSessionResult.errorMessage) {
            customKomojuErrors.error('kOMOJU session creation  API responded with the following error message: ' + komojuCreateSessionResult.errorMessage);
        } else {
            customKomojuErrors.error('komojuservicecreatesession API Service is Unavailable: with no error message');
        }
        viewData.error = 'komoju payment error';
        res.json({
            fieldErrors: [],
            serverErrors: [Resource.msg('method.not.supported', 'komojuPayment', null)],
            error: true
        });
        this.emit('route:Complete', req, res);
        return '';
    }


    // Creates a new order.
    var order;
    order = komojuHelpers.createOrder(currentBasket, session.privacy.tempOrderNumber ? session.privacy.tempOrderNumber : '');
    if (order) {
        session.privacy.tempOrderToken = order.getOrderToken();
    }

    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }
    Transaction.wrap(function () {
        var paymentInstrument;
        var paymentInstruments;
        if (order) {
            paymentInstruments = order.getPaymentInstruments();
            collections.forEach(paymentInstruments, function (item) {
                order.removePaymentInstrument(item);
            });
            order.createPaymentInstrument(
                'KOMOJU_HOSTED_PAGE', order.totalGrossPrice
            );
            order.custom.komojuExchangeRate = komojuExchangeRate;
        }


        paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');

        collections.forEach(paymentInstruments, function (item) {
            paymentInstrument = item;
        });
        if (paymentInstrument) {
            paymentInstrument.custom.transactionStatus = 'pending';
        }
        order.custom.komojuSessionId = sessionId;
    });

    res.json({
        sessionURL: sessionUrl,
        error: false
    });
    return next();
});
server.get('KomojuOrder', csrfProtection.generateToken, server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var URLUtils = require('dw/web/URLUtils');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var komojuHelper = require('*/cartridge/scripts/komojuHelpers');
    var collections = require('*/cartridge/scripts/util/collections');
    var Order = require('dw/order/Order');
    var result;
    var komojuServiceGetResponse = require('*/cartridge/services/komojuServiceGetResponse');
    var customKomojuSourceLogger = Logger.getLogger('customKomojuSourceLogger', 'customKomojuSourceLogger');
    var status = null;
    var transactionStatus;
    var paymentId;
    var order;
    var success = {
        message: '',
        error: false
    };
    Logger.warn('warning');

    var tempOrderToken = session.privacy.tempOrderToken;
    var tempOrderNumber = session.privacy.tempOrderNumber;

    if (tempOrderNumber && tempOrderToken) {
        order = OrderMgr.getOrder(tempOrderNumber, tempOrderToken);
    }

    if (!order) {
        res.redirect(URLUtils.url('Home-Show'));
        return next();
    }
    if (order.custom.komojuOrderProcessed === true) {
        res.redirect(URLUtils.url('Home-Show'));
        return next();
    }

    Transaction.wrap(function () {
        if (order) {
            var paymentInstruments = order.getPaymentInstruments(
                'KOMOJU_HOSTED_PAGE'
            );
            collections.forEach(paymentInstruments, function (item) {
                order.removePaymentInstrument(item);
            });
            order.createPaymentInstrument(
                'KOMOJU_HOSTED_PAGE', order.totalGrossPrice
            );
        }
    });

    try {
        customKomojuSourceLogger.info('-----KOMOJU sessioncreate API Request Body-----');
        result = komojuServiceGetResponse.KomojuService.call({ order: order });
    } catch (e) {
        Logger.error('Error while calling the service komojuServiceGetResponse to get payment details of current session ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    Logger.warn(result);
    if (!result) {
        komojuHelper.failorder(
            order
        );
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('error.connecting.komoju', 'komojuPayment', null)));
        return next();
    }
    if (result.error !== 0) {
        komojuHelper.failorder(
            order
        );
        if (result.status === 'SERVICE_UNAVAILABLE') {
            customKomojuErrors.error('komoju Service is Unavailable: ' + result.unavailableReason);
        } else if (result.error && result.errorMessage) {
            customKomojuErrors.error('komojuServiceGetResponse  API responded with the following error message: ' + result.errorMessage);
        } else {
            customKomojuErrors.error('komojuServiceGetResponse API Service is Unavailable: with no error message');
        }
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'customer', 'PlaceOrderError', Resource.msg('error.connecting.komoju', 'komojuPayment', null)));
        return next();
    }
    if (result.object) {
        customKomojuSourceLogger.info('-----komoju response komojuServiceGetResponse API Response Body-----');
        customKomojuSourceLogger.info(result.object.text);
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
                order.custom.komojuPaymentId = paymentId;
            });
        } catch (e) {
            Logger.error('Error while executing the script planConfirmation.js: function updateAccessToken() :: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        }
        transactionStatus = result.object.payment.status;
        komojuHelper.failorder(
            order

        );
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('returned.back.komoju', 'komojuPayment', null)));
        return next();
    }
    if (result.object.status === 'pending' && result.object.payment == null) {
        komojuHelper.failorder(
            order

        );
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('returned.back.komoju', 'komojuPayment', null)));
        return next();
    }

    if (result.object.status === 'cancelled') {
        komojuHelper.setinstruments(
            result,
            order

        );

        paymentId = result.object.payment.id;
        status = 1;
        transactionStatus = result.object.payment.status;
        if (result.object.payment.status === 'cancelled') {
            success.message = Resource.msg('cancelled.order.komoju', 'komojuPayment', null);
            success.error = true;
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
            success.message = Resource.msg('order.created.komoju', 'komojuPayment', null);
        } else if (result.object.payment.status === 'captured') {
            success.message = Resource.msg('order.captured.komoju', 'komojuPayment', null);
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
    if (status != null && status !== 2 && order) {
        if (order.getStatus().value === Order.ORDER_STATUS_FAILED) {
            komojuHelper.undoFail(order);
        }
        var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
        session.privacy.session_id = null;

        if (!placeOrderResult.error) {
            Transaction.wrap(function () {
                if (result.object.payment.status === 'captured') { order.custom.komojuOrderProcessed = true; }
            });
            session.privacy.prevTotalGrossPrice = undefined;
        }
    }


    if (status === 1 && order) {
        var orderStatus = order.getStatus().toString();
        if (orderStatus === 'CREATED' || orderStatus === 'NEW' || orderStatus === 'OPEN') {
            Transaction.wrap(function () {
                var paymentInstrument = order.getPaymentInstruments();
                paymentInstrument[0].custom.transactionStatus = transactionStatus;
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
        allAddresses.forEach(function (address) {
            if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
            }
        });
    }


    if (order.getCustomerEmail()) {
        COHelpers.sendConfirmationEmail(order, req.locale.id);
    }
    try {
        Transaction.wrap(function () {
            order.custom.komojuPaymentId = paymentId;
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
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var passwordForm;
    var customObject = {};
    var komojuCustomObject = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1);
    var availablePaymentMethods = komojuCustomObject.custom.availableKomojuPaymentMethods;
    var jsonavailablePaymentMethods = null;
    var currentMethodDisplayName;
    var locale = req.locale;
    if (locale.id.length > 2) {
        locale = locale.id.slice(0, 2);
    }
    if (locale !== 'ja' && locale !== 'ko') {
        locale = 'en';
    }
    var allMethods;
    try {
        jsonavailablePaymentMethods = JSON.parse(availablePaymentMethods);
    } catch (e) {
        Logger.error('error in parsing payment methods from site preference availablePaymentMethods ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }
    if (jsonavailablePaymentMethods != null) {
        allMethods = jsonavailablePaymentMethods.c_availablePaymentMethods;
        var currentMethod = order.paymentInstruments[0].custom.komojuPaymentMethodType;
        currentMethodDisplayName = fetchDisplayName.fetchDisplayName(allMethods, currentMethod, locale);
    }
    customObject.paymentMethod = currentMethodDisplayName;
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
    req.session.raw.custom.orderID = req.querystring.ID;
    return next();
}
);
server.post('HandleWebHooksRefund', function (req, res, next) {
    var bodyToEncode = req.body;
    var komojuSignature = req.httpHeaders['x-komoju-signature'];

    var webhookCallVerified = komojuHelpers.verifyWebhookCall(bodyToEncode, komojuSignature);
    var paymentIdKomoju;
    var body;
    body = JSON.parse(req.body);
    paymentIdKomoju = JSON.parse(req.body).data.id;

    var komojuOrder = OrderMgr.searchOrder('custom.komojuPaymentId = {0}', paymentIdKomoju);

    if (komojuOrder) {
        if (webhookCallVerified) {
            Transaction.wrap(function () {
                var paymentInstrument = komojuOrder.getPaymentInstruments();
                paymentInstrument[0].custom.transactionStatus = body.data.status;
                komojuOrder.setPaymentStatus(0);
                komojuOrder.custom.komojuRefundStatus = Resource.msg('amount.refunded.komoju', 'komojuPayment', null);
                komojuOrder.custom.komojuRefundResponse = Resource.msg('amount.refunded.komoju.message', 'komojuPayment', null);
            });
        } else {
            customKomojuErrors.error(Resource.msgf('authentication.code.mismatch', 'komojuPayment', null, body.type, komojuOrder.orderNo));
        }
    }
    res.json({ data: true });
    return next();
});
server.post('HandleWebHooksCaptureComplete', function (req, res, next) {
    var Order = require('dw/order/Order');
    var customKomojuSourceLogger = Logger.getLogger('customKomojuSourceLogger', 'customKomojuSourceLogger');

    var paymentIdKomoju = JSON.parse(req.body).data.id;
    var body = JSON.parse(req.body);
    var paymentInstrument;
    var orderStatus;

    var bodyToEncode = req.body;
    var komojuSignature = req.httpHeaders['x-komoju-signature'];

    var webhookCallVerified = komojuHelpers.verifyWebhookCall(bodyToEncode, komojuSignature);

    try {
        Transaction.wrap(function () {
            order.custom.komojuPaymentId = paymentIdKomoju;
        });
    } catch (e) {
        Logger.error('Error saving paymentId ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    var komojuOrder = OrderMgr.searchOrder('custom.komojuPaymentId = {0}', paymentIdKomoju);

    // Fallback to session id
    if (!komojuOrder) {
        var sessionIdKomoju = JSON.parse(req.body).data.session;
        komojuOrder = OrderMgr.searchOrder('custom.komojuSessionId = {0}', sessionIdKomoju);
    }

    customKomojuSourceLogger.info("Komoju Order: " + (komojuOrder ? komojuOrder.orderNo : "No order found"));

    if (komojuOrder) {
        orderStatus = komojuOrder.getStatus().toString();
    }
    if (komojuOrder) {
        if (webhookCallVerified) {
            Transaction.wrap(function () {
                if (komojuOrder && orderStatus === 'CREATED') {
                    OrderMgr.placeOrder(komojuOrder);
                } else if (orderStatus === 'CANCELLED') {
                    OrderMgr.undoCancelOrder(komojuOrder);
                }
                komojuOrder.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                komojuOrder.setExportStatus(Order.EXPORT_STATUS_READY);
                paymentInstrument = komojuOrder.getPaymentInstruments();
                paymentInstrument[0].custom.transactionStatus = body.data.status;
                komojuOrder.setPaymentStatus(2);
            });
        } else {
            customKomojuErrors.error(Resource.msgf('authentication.code.mismatch', 'komojuPayment', null, body.type, komojuOrder.orderNo));
        }
    }
    res.json({ data: true });
    return next();
});
server.post('HandleWebHooksCancelled', function (req, res, next) {
    var customKomojuSourceLogger = Logger.getLogger('customKomojuSourceLogger', 'customKomojuSourceLogger');
    var bodyToEncode = req.body;
    var body = JSON.parse(req.body);
    var komojuSignature = req.httpHeaders['x-komoju-signature'];

    var webhookCallVerified = komojuHelpers.verifyWebhookCall(bodyToEncode, komojuSignature);
    var paymentIdKomoju = JSON.parse(req.body).data.id;
    var komojuOrder = OrderMgr.searchOrder('custom.komojuPaymentId = {0}', paymentIdKomoju);

    // Fallback to session id
    if (!komojuOrder) {
        sessionIdKomoju = JSON.parse(req.body).data.session;
        komojuOrder = OrderMgr.searchOrder('custom.komojuSessionId = {0}', sessionIdKomoju);
    }

    customKomojuSourceLogger.info("Komoju Order: " + (komojuOrder ? komojuOrder.orderNo : "No order found"));

    if (komojuOrder) {
        if (webhookCallVerified) {
            var orderStatus = komojuOrder.getStatus().toString();
            Transaction.wrap(function () {
                if (orderStatus === 'CREATED' || orderStatus === 'NEW' || orderStatus === 'OPEN' || orderStatus === 'FAILED' || orderStatus === 'CANCELLED') {
                    OrderMgr.cancelOrder(komojuOrder);
                    var paymentInstrument = komojuOrder.getPaymentInstruments();
                    paymentInstrument[0].custom.transactionStatus = body.data.status;
                    komojuOrder.setPaymentStatus(0);
                    komojuOrder.custom.komojuCancelStatus = Resource.msg('amount.cancelled.komoju', 'komojuPayment', null);
                    komojuOrder.custom.komojuCancelResponse = Resource.msg('amount.cancelled.komoju.message', 'komojuPayment', null);
                }
            });
        } else {
            customKomojuErrors.error(Resource.msgf('authentication.code.mismatch', 'komojuPayment', null, body.type, komojuOrder.orderNo));
        }
    }
    res.json({ data: true });
    return next();
});

server.post('HandleWebHooksExpired', function (req, res, next) {
    var sessionIdKomoju = JSON.parse(req.body).data.session;
    var body = JSON.parse(req.body);

    var bodyToEncode = req.body;
    var komojuSignature = req.httpHeaders['x-komoju-signature'];

    var webhookCallVerified = komojuHelpers.verifyWebhookCall(bodyToEncode, komojuSignature);


    var komojuOrder = OrderMgr.searchOrder('custom.komojuSessionId = {0}', sessionIdKomoju);
    if (komojuOrder) {
        if (webhookCallVerified) {
            var orderStatus = komojuOrder.getStatus().toString();
            Transaction.wrap(function () {
                var paymentInstrument;
                if (orderStatus === 'NEW' || orderStatus === 'OPEN') {
                    OrderMgr.cancelOrder(komojuOrder);
                } else if (orderStatus === 'CREATED') {
                    OrderMgr.failOrder(komojuOrder, false);
                }
                paymentInstrument = komojuOrder.getPaymentInstruments();
                paymentInstrument[0].custom.transactionStatus = body.data.status;
                komojuOrder.setPaymentStatus(0);
            });
        } else {
            customKomojuErrors.error(Resource.msgf('authentication.code.mismatch', 'komojuPayment', null, body.type, komojuOrder.orderNo));
        }
    }
    res.json({ data: true });
    return next();
});


server.post('HandleWebHooksPaymentAuthorized', function (req, res, next) {
    var sessionIdKomoju = JSON.parse(req.body).data.session;
    var Order = require('dw/order/Order');
    var komojuOrder = OrderMgr.searchOrder('custom.komojuSessionId = {0}', sessionIdKomoju);
    var body = JSON.parse(req.body);
    var paymentInstrument;
    var orderStatus;
    var bodyToEncode = req.body;
    var komojuSignature = req.httpHeaders['x-komoju-signature'];
    var webhookCallVerified = komojuHelpers.verifyWebhookCall(bodyToEncode, komojuSignature);

    if (komojuOrder) {
        if (webhookCallVerified) {
            orderStatus = komojuOrder.getStatus().toString();
            Transaction.wrap(function () {
                if (orderStatus === 'CREATED') {
                    OrderMgr.placeOrder(komojuOrder);
                }
                komojuOrder.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                komojuOrder.setExportStatus(Order.EXPORT_STATUS_READY);
                paymentInstrument = komojuOrder.getPaymentInstruments();
                paymentInstrument[0].custom.transactionStatus = body.data.status;
                komojuOrder.setPaymentStatus(0);
                komojuOrder.custom.komojuPaymentId = body.data.id;
            });
            komojuHelpers.setInstrumentFromAuthorizeWebHook(body, komojuOrder);
            COHelpers.handlePayments(komojuOrder, komojuOrder.orderNo);
        } else {
            customKomojuErrors.error(Resource.msgf('authentication.code.mismatch', 'komojuPayment', null, body.type, komojuOrder.orderNo));
        }
    }
    res.json({ data: true });
    return next();
});

module.exports = server.exports();
