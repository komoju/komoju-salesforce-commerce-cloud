'use strict';
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');
var komojuServiceGetResponse = require('*/cartridge/services/komojuServiceGetResponse');
var komojuHelper = require('*/cartridge/scripts/komojuHelpers');
var Transaction = require('dw/system/Transaction');
var Cart = app.getModel('Cart');
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Order = app.getModel('Order');
var OrderClass = require('dw/order/Order');
var Resource = require('dw/web/Resource');

var PaymentMgr = require('dw/order/PaymentMgr');
var Status = require('dw/system/Status');
var PaymentProcessor = app.getModel('PaymentProcessor');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var customKomojuSourceLogger = Logger.getLogger('customKomojuSourceLogger', 'customKomojuSourceLogger');
var customKomojuErrors = Logger.getLogger('customKomojuErrors', 'customKomojuErrors');
var res = require('*/cartridge/scripts/util/Response');

/**
 * This function is called for clear shipping and billing form
 */
function clearForms() {
    // Clears all forms used in the checkout process.
    session.forms.singleshipping.clearFormElement();
    session.forms.multishipping.clearFormElement();
    session.forms.billing.clearFormElement();
}

/**
 * This function is called for payment authorization
 * payment processor model authorize method is called in it.
 * @param {Object} order contains the orders
 *  @return {Object} shows error
 */
function handlePayments(order) {
    if (order.getTotalNetPrice().value !== 0.00) {
        var paymentInstruments = order.getPaymentInstruments();

        if (paymentInstruments.length === 0) {
            return {
                missingPaymentInfo: true
            };
        }
        /**
         * Sets the transaction ID for the payment instrument.
         */
        var paymentInstrument;
        var handlePaymentTransaction = function () {
            paymentInstrument.getPaymentTransaction().setTransactionID(order.getOrderNo());
        };

        for (var i = 0; i < paymentInstruments.length; i++) {
            paymentInstrument = paymentInstruments[i];

            if (PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor() === null) {
                Transaction.wrap(handlePaymentTransaction);
            } else {
                var authorizationResult = PaymentProcessor.authorize(order, paymentInstrument);

                if (authorizationResult.not_supported || authorizationResult.error) {
                    return {
                        error: true
                    };
                }
            }
        }
    }

    return {};
}

/**
 * This function is called when the return from komoju server page for handling the order
 * the {@link module:controllers/COSummary~ShowConfirmation|COSummary controller ShowConfirmation function}
 *  @return {Object} show error object.
 */
function KomojuOrder() {
    var komojuServiceGetResponseResult;
    var status = null;
    var transactionStatus;
    var paymentId;
    var order;
    var placeOrderResult = {};
    var tempOrderToken = session.privacy.tempOrderToken;
    var tempOrderNumber = session.privacy.tempOrderNumber;
    var summaryBody = {};

    if (tempOrderNumber && tempOrderToken) {
        order = OrderMgr.getOrder(tempOrderNumber, tempOrderToken);
    }
    if (!order || order.custom.komojuOrderProcessed === true) {
        app.getController('Cart').Show();
        return {};
    }

    Transaction.wrap(function () {
        var paymentInstruments;
        paymentInstruments = order.getPaymentInstruments(
            'KOMOJU_HOSTED_PAGE'
        );
        Object.keys(paymentInstruments).forEach(function (item) {
            order.removePaymentInstrument(paymentInstruments[item]);
        });
        order.createPaymentInstrument(
            'KOMOJU_HOSTED_PAGE', order.totalGrossPrice
        );
    });


    try {
        customKomojuSourceLogger.info('-----KOMOJU GetResponse API Request Body-----');
        komojuServiceGetResponseResult = komojuServiceGetResponse.KomojuService.call({
            order: order
        });
    } catch (e) {
        Logger.error('Error while calling the service komojuoServiceGetResponse to get payment detiails of current session ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    if (!komojuServiceGetResponseResult) {
        komojuHelper.failorder(
            order
        );
        summaryBody.fallBackMessage = Resource.msg('error.connecting.komoju', 'komojuPayment', null);
        app.getForm('billing').object.fulfilled.value = true;
        return app.getController('COSummary').Start(summaryBody);
    }

    if (komojuServiceGetResponseResult.error !== 0) {
        if (komojuServiceGetResponseResult.status === 'SERVICE_UNAVAILABLE') {
            customKomojuErrors.error('KOMOJU Service is Unavailable: ' + komojuServiceGetResponseResult.unavailableReason);
        } else if (komojuServiceGetResponseResult.error && komojuServiceGetResponseResult.errorMessage) {
            customKomojuErrors.error('komojuServiceGetResponse  API responded with the following error message: ' + komojuServiceGetResponseResult.errorMessage);
        } else {
            customKomojuErrors.error('komojuServiceGetResponse API Service is Unavailable: with no error message');
        }
        komojuHelper.failorder(
            order
        );
        summaryBody.fallBackMessage = Resource.msg('error.connecting.komoju', 'komojuPayment', null);
        app.getForm('billing').object.fulfilled.value = true;
        return app.getController('COSummary').Start(summaryBody);
    }
    if (komojuServiceGetResponseResult.object) {
        customKomojuSourceLogger.info('-----KOMOJU response komojuServiceGetResponse API Response Body-----');
        customKomojuSourceLogger.info(komojuServiceGetResponseResult.object.text);
    }
    if (komojuServiceGetResponseResult.object.status === 'pending' && komojuServiceGetResponseResult.object.payment !== null) {
        status = 2;
        paymentId = komojuServiceGetResponseResult.object.payment.id;
        komojuHelper.setinstruments(
            komojuServiceGetResponseResult,
            order
        );
        transactionStatus = komojuServiceGetResponseResult.object.payment.status;
        komojuHelper.failorder(
            order
        );
        app.getForm('billing').object.fulfilled.value = true;
        summaryBody.fallBackMessage = Resource.msg('returned.back.komoju', 'komojuPayment', null);
        return app.getController('COSummary').Start(summaryBody);
    }
    if (komojuServiceGetResponseResult.object.status === 'pending' && komojuServiceGetResponseResult.object.payment === null) {
        komojuHelper.failorder(
            order
        );
        summaryBody.fallBackMessage = Resource.msg('returned.back.komoju', 'komojuPayment', null);
        app.getForm('billing').object.fulfilled.value = true;
        return app.getController('COSummary').Start(summaryBody);
    }
    if (komojuServiceGetResponseResult.object.status === 'cancelled') {
        komojuHelper.setinstruments(
            komojuServiceGetResponseResult,
            order
        );
        paymentId = komojuServiceGetResponseResult.object.payment.id;
        status = 1;
        transactionStatus = komojuServiceGetResponseResult.object.payment.status;
    }
    if (komojuServiceGetResponseResult.object.status === 'completed') {
        komojuHelper.setinstruments(
            komojuServiceGetResponseResult,
            order
        );
        status = 3;
        paymentId = komojuServiceGetResponseResult.object.payment.id;
        transactionStatus = komojuServiceGetResponseResult.object.payment.status;
    }
    var handlePaymentsResult = handlePayments(order);
    if (handlePaymentsResult.error) {
        return Transaction.wrap(function () {
            OrderMgr.failOrder(order);
            return {
                error: true,
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
            };
        });
    } else if (handlePaymentsResult.missingPaymentInfo) {
        return Transaction.wrap(function () {
            OrderMgr.failOrder(order);
            return {
                error: true,
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
            };
        });
    }

    // Places the order
    var orderStatus;
    if (status !== null && status !== 2) {
        orderStatus = order.getStatus().toString();
        if (orderStatus === 'CREATED') {
            placeOrderResult = Order.submit(order);
        } else {
            placeOrderResult.order_created = 'capturedBefore';
        }
        if (!placeOrderResult.error) {
            Transaction.wrap(function () {
                if (komojuServiceGetResponseResult.object.payment.status === 'captured') { order.custom.komojuOrderProcessed = true; }
            });
        }
        session.privacy.session_id = null;
    }


    if (status === 1) {
        orderStatus = order.getStatus().toString();
        if (orderStatus === 'CREATED' || orderStatus === 'NEW' || orderStatus === 'OPEN') {
            Transaction.wrap(function () {
                var paymentInstrument = order.getPaymentInstruments();
                paymentInstrument[0].custom.transactionStatus = transactionStatus;
                order.setPaymentStatus(0);
                order.setConfirmationStatus(OrderClass.CONFIRMATION_STATUS_NOTCONFIRMED);
            });


            var cancelOrderResult = komojuHelper.cancelOrder(order);
            if (cancelOrderResult.error) {
                response.redirect(URLUtils.https('COBilling-Start'));
                return;
            }
        }
    }
    try {
        Transaction.wrap(function () {
            order.custom.komojuPaymentId = paymentId;
            if (transactionStatus === 'captured') {
                order.setPaymentStatus(2);
                order.setConfirmationStatus(2);
            } else if (transactionStatus === 'authorized') {
                order.setPaymentStatus(0);
            }
        });
    } catch (e) {
        Logger.error('Error while executing the script planConfirmation.js: function updateAccessToken() :: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    if (placeOrderResult.error) {
        return app.getController('COSummary').Start({
            PlaceOrderError: placeOrderResult.PlaceOrderError
        });
    } else if (placeOrderResult.order_created === true) {
        clearForms();
        return app.getController('COSummary').ShowConfirmation(placeOrderResult.Order);
    } else if (placeOrderResult.order_created === 'capturedBefore') {
        clearForms();
        return app.getController('COSummary').ShowConfirmation(order);
    }
}

/**
 * This function is called for creating order, payment instrument and create session if gross price is changed.
 *  @return {Object} return redirect url.
 */
function geturl() {
    var currentBasket = BasketMgr.getCurrentBasket();
    var cart = Cart.get();
    if (!cart) {
        app.getController('Cart').Show();
        return {};
    }
    var COShipping = app.getController('COShipping');

    // Clean shipments.
    COShipping.PrepareShipments(cart);

    // Make sure there is a valid shipping address, accounting for gift certificates that do not have one.
    if (cart.getProductLineItems().size() > 0 && cart.getDefaultShipment().getShippingAddress() === null) {
        COShipping.Start();
        return {};
    }

    // Make sure the billing step is fulfilled, otherwise restart checkout.
    if (!session.forms.billing.fulfilled.value) {
        app.getController('COCustomer').Start();
        return {};
    }

    Transaction.wrap(function () {
        cart.calculate();
    });

    var COBilling = app.getController('COBilling');

    Transaction.wrap(function () {
        if (!COBilling.ValidatePayment(cart)) {
            COBilling.Start();
            return {};
        }
    });

    // Recalculate the payments. If there is only gift certificates, make sure it covers the order total, if not
    // back to billing page.
    Transaction.wrap(function () {
        if (!cart.calculatePaymentTransactionTotal()) {
            COBilling.Start();
            return {};
        }
    });

    // Handle used addresses and credit cards.
    var saveCCResult = COBilling.SaveCreditCard();

    if (!saveCCResult) {
        return {
            error: true,
            PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
        };
    }

    // Creates a new order. This will internally ReserveInventoryForOrder and will create a new Order with status
    // 'Created'.

    var confirmPageUrl;
    var sessionId;

    var totalGrossPrice = currentBasket.totalGrossPrice.value;
    var tempOrderNumber;
    Transaction.wrap(function () { tempOrderNumber = OrderMgr.createOrderNo(); });
    session.privacy.tempOrderNumber = tempOrderNumber;

    var name = currentBasket.billingAddress.fullName;
    var email = currentBasket.customerEmail;
    var address1 = currentBasket.shipments[0].shippingAddress.address1;
    var address2 = currentBasket.shipments[0].shippingAddress.address2;
    var postalCode = currentBasket.shipments[0].shippingAddress.postalCode;
    var city = currentBasket.shipments[0].shippingAddress.city;
    var country = currentBasket.shipments[0].shippingAddress.countryCode.displayValue;
    var locale = request.locale;
    var method = currentBasket.custom.komojuPaymentMethodType;
    var updatedAmount;
    var currency = request.session.currency.currencyCode;
    var returnUrl = URLUtils.abs('KomojuController-KomojuOrder');
    var cancelUrl = URLUtils.abs('COBilling-Start');
    var komojuExchangeRate;
    var komojuCancelSessionResult;
    var previousSessionId;
    var noCentCurrency = [
        'DIF', 'CLP', 'BIF',
        'GNF', 'JPY', 'KMF',
        'KRW', 'MGA', 'PYG',
        'RWF', 'UGX', 'VND',
        'VUV', 'XAF', 'XOF',
        'XPF'];

    if (noCentCurrency.includes(currency)) {
        updatedAmount = totalGrossPrice;
    } else {
        updatedAmount = totalGrossPrice * 100;
    }
    if (locale.length > 2) {
        locale = locale.slice(0, 2);
    }
    if (locale !== 'ja' && locale !== 'ko') {
        locale = 'en';
    }
    var body = {};
    body = {
        'payment_types[]': method,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        amount: updatedAmount,
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

    var komojuCreateSessionResult;
    if (session.privacy.session_id) {
        previousSessionId = session.privacy.session_id;
        try {
            komojuCancelSessionResult = komojuHelper.cancelSession(previousSessionId);
        } catch (e) {
            Logger.error('Error while executing the service komojuServiceCancelSession ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        }
        if (komojuCancelSessionResult.status === 'OK') {
            session.privacy.session_id = null;
        }
    }

    try {
        customKomojuSourceLogger.info('-----KOMOJU komojuServiceCreateSession API Request Body-----');
        customKomojuSourceLogger.info(JSON.stringify(body));
        komojuCreateSessionResult = komojuHelper.createSession(body);
    } catch (e) {
        Logger.error('Error while executing the service komojuServiceCreateSession ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }
    if (komojuCreateSessionResult.object !== null) {
        customKomojuSourceLogger.info('-----KOMOJU response API Response Body-----');
        customKomojuSourceLogger.info(JSON.stringify(komojuCreateSessionResult.object));
        sessionId = komojuCreateSessionResult.object.id;
        confirmPageUrl = komojuCreateSessionResult.object.session_url;
        komojuExchangeRate = parseFloat((komojuCreateSessionResult.object.payment_methods[0].exchange_rate).toFixed(4));
        Transaction.wrap(function () {
            currentBasket.custom.komojuSessionId = komojuCreateSessionResult.object.id;
            currentBasket.custom.komojuSessionUrl = komojuCreateSessionResult.object.session_url;
            currentBasket.custom.komojuPaymentMethodType = method;
            session.privacy.session_id = sessionId;
            session.privacy.prevTotalGrossPrice = totalGrossPrice;
        });
    } else {
        if (komojuCreateSessionResult.status === 'SERVICE_UNAVAILABLE') {
            customKomojuErrors.error('komojuservicecreatesession API Service is Unavailable: ' + komojuCreateSessionResult.unavailableReason);
        } else if (komojuCreateSessionResult.error && komojuCreateSessionResult.errorMessage) {
            customKomojuErrors.error('kOMOJU session creation  API responded with the following error message: ' + komojuCreateSessionResult.errorMessage);
        } else {
            customKomojuErrors.error('komojuservicecreatesession API Service is Unavailable: with no error message');
        }
        res.renderJSON({
            komojuMethodError: true
        });
        return;
    }

    var order;
    order = komojuHelper.createOrder(currentBasket, tempOrderNumber || '');
    if (!order) {
        app.getController('Cart').Show();
        return {};
    }
    session.privacy.tempOrderToken = order.getOrderToken();
    Transaction.wrap(function () {
        var paymentInstrument;
        var paymentInstruments;
        if (order) {
            paymentInstruments = order.getPaymentInstruments(
                'KOMOJU_HOSTED_PAGE'
            );
            Object.keys(paymentInstruments).forEach(function (item) {
                order.removePaymentInstrument(paymentInstruments[item]);
            });

            order.createPaymentInstrument(
                'KOMOJU_HOSTED_PAGE', order.totalGrossPrice
            );
        }
        paymentInstruments = order.getPaymentInstruments('KOMOJU_HOSTED_PAGE');
        Object.keys(paymentInstruments).forEach(function (item) {
            paymentInstrument = paymentInstruments[item];
        });
        paymentInstrument.custom.transactionStatus = 'pending';
        order.custom.komojuSessionId = sessionId;
        order.custom.komojuExchangeRate = komojuExchangeRate;
    });
    res.renderJSON({
        sessionURL: confirmPageUrl,
        error: false
    });
    return;
}

/**
 * This function is called when payment is refunded on komoju.
 */
function HandleWebHooksRefund() {
    var requestData;
    var bodyToEncode = request.httpParameterMap.requestBodyAsString;
    var komojuSignature = request.httpHeaders['x-komoju-signature'];
    requestData = JSON.parse(request.httpParameterMap.requestBodyAsString);
    var webhookCallVerified = komojuHelper.verifyWebhookCall(bodyToEncode, komojuSignature);
    var currentOrder = OrderMgr.searchOrder('custom.komojuPaymentId = {0}', requestData.data.id);
    if (currentOrder) {
        if (webhookCallVerified) {
            Transaction.wrap(function () {
                var paymentInstrument = currentOrder.getPaymentInstruments();
                paymentInstrument[0].custom.transactionStatus = requestData.data.status;
                currentOrder.setPaymentStatus(0);
                currentOrder.custom.komojuRefundStatus = Resource.msg('amount.refunded.komoju', 'komojuPayment', null);
                currentOrder.custom.komojuRefundResponse = Resource.msg('amount.refunded.komoju.message', 'komojuPayment', null);
            });
        } else {
            customKomojuErrors.error(Resource.msgf('authentication.code.mismatch', 'komojuPayment', null, requestData.type, currentOrder.orderNo));
        }
    }
    res.renderJSON({
        data: true
    });
    return;
}

/**
 * This function is called when payment is cancelled on komoju.
 */
function HandleWebHooksCancelled() {
    var requestData;
    var bodyToEncode = request.httpParameterMap.requestBodyAsString;
    var komojuSignature = request.httpHeaders['x-komoju-signature'];
    var webhookCallVerified = komojuHelper.verifyWebhookCall(bodyToEncode, komojuSignature);
    requestData = JSON.parse(request.httpParameterMap.requestBodyAsString);
    var currentOrder = OrderMgr.searchOrder('custom.komojuPaymentId = {0}', requestData.data.id);

    // Fallback to session id
    if (!currentOrder) {
        var sessionIdKomoju = JSON.parse(req.body).data.session;
        currentOrder = OrderMgr.searchOrder('custom.komojuSessionId = {0}', sessionIdKomoju);
    }

    customKomojuSourceLogger.info("Komoju Order: " + (currentOrder ? currentOrder.orderNo : "No order found"));

    var orderStatus = currentOrder.getStatus().toString();
    if (currentOrder) {
        if (webhookCallVerified) {
            Transaction.wrap(function () {
                if (orderStatus === 'CREATED' || orderStatus === 'NEW' || orderStatus === 'OPEN' || orderStatus === 'FAILED' || orderStatus === 'CANCELLED') {
                    OrderMgr.cancelOrder(currentOrder);
                    var paymentInstrument = currentOrder.getPaymentInstruments();
                    paymentInstrument[0].custom.transactionStatus = requestData.data.status;
                    currentOrder.setPaymentStatus(0);
                    currentOrder.custom.komojuCancelStatus = Resource.msg('amount.cancelled.komoju', 'komojuPayment', null);
                    currentOrder.custom.komojuCancelResponse = Resource.msg('amount.cancelled.komoju.message', 'komojuPayment', null);
                }
            });
        } else {
            customKomojuErrors.error(Resource.msgf('authentication.code.mismatch', 'komojuPayment', null, requestData.type, currentOrder.orderNo));
        }
    }
    res.renderJSON({
        data: true
    });
    return;
}

/**
 * This function is called when payment is captured on komoju.
 */
function HandleWebHooksCaptureComplete() {
    var paymentIdKomoju = JSON.parse(request.httpParameterMap.requestBodyAsString).data.id;
    var bodyToEncode = request.httpParameterMap.requestBodyAsString;
    var komojuSignature = request.httpHeaders['x-komoju-signature'];
    var webhookCallVerified = komojuHelper.verifyWebhookCall(bodyToEncode, komojuSignature);
    var body = JSON.parse(request.httpParameterMap.requestBodyAsString);
    var paymentInstrument;
    var orderStatus;

    try {
        Transaction.wrap(function () {
            order.custom.komojuPaymentId = paymentIdKomoju;
        });
    } catch (e) {
        Logger.error('Error saving paymentId in HandleWebHooksCaptureComplete: ' + e.toString());
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
            orderStatus = komojuOrder.getStatus().toString();
            Transaction.wrap(function () {
                if (komojuOrder && orderStatus === 'CREATED') {
                    OrderMgr.placeOrder(komojuOrder);
                } else if (komojuOrder && (orderStatus === 'CANCELLED')) {
                    OrderMgr.undoCancelOrder(komojuOrder);
                }
                komojuOrder.setConfirmationStatus(OrderClass.CONFIRMATION_STATUS_CONFIRMED);
                komojuOrder.custom.komojuOrderProcessed = true;
                komojuOrder.setExportStatus(OrderClass.EXPORT_STATUS_READY);
                paymentInstrument = komojuOrder.getPaymentInstruments();
                paymentInstrument[0].custom.transactionStatus = body.data.status;
                komojuOrder.setPaymentStatus(2);
            });
        } else {
            customKomojuErrors.error(Resource.msgf('authentication.code.mismatch', 'komojuPayment', null, body.type, komojuOrder.orderNo));
        }
    }
    res.renderJSON({
        data: true
    });
    return;
}

/**
 * This function is called when payment is authorized on komoju.
 */
function HandleWebHooksPaymentAuthorized() {
    var body = JSON.parse(request.httpParameterMap.requestBodyAsString);
    var bodyToEncode = request.httpParameterMap.requestBodyAsString;
    var komojuSignature = request.httpHeaders['x-komoju-signature'];
    var webhookCallVerified = komojuHelper.verifyWebhookCall(bodyToEncode, komojuSignature);
    var paymentInstrument;
    var orderStatus;
    var komojuOrder = OrderMgr.searchOrder('custom.komojuSessionId = {0}', body.data.session);
    if (komojuOrder) {
        orderStatus = komojuOrder.getStatus().toString();
    }
    if (komojuOrder) {
        if (webhookCallVerified) {
            orderStatus = komojuOrder.getStatus().toString();
            Transaction.wrap(function () {
                if (komojuOrder && orderStatus === 'CREATED') {
                    Order.submit(komojuOrder);
                }
                komojuOrder.setConfirmationStatus(OrderClass.CONFIRMATION_STATUS_CONFIRMED);
                komojuOrder.setExportStatus(OrderClass.EXPORT_STATUS_READY);
                paymentInstrument = komojuOrder.getPaymentInstruments();
                paymentInstrument[0].custom.transactionStatus = body.data.status;
                komojuOrder.setPaymentStatus(0);
                komojuOrder.custom.komojuPaymentId = body.data.id;
            });
            komojuHelper.setInstrumentFromAuthorizeWebHook(body, komojuOrder);
            handlePayments(komojuOrder);
        } else {
            customKomojuErrors.error(Resource.msgf('authentication.code.mismatch', 'komojuPayment', null, body.type, komojuOrder.orderNo));
        }
    }
    res.renderJSON({
        data: true
    });
    return;
}

/**
 * This function is called when payment is expired on komoju.
 */
function HandleWebHooksExpired() {
    var sessionIdKomoju = JSON.parse(request.httpParameterMap.requestBodyAsString).data.session;
    var body = JSON.parse(request.httpParameterMap.requestBodyAsString);
    var bodyToEncode = request.httpParameterMap.requestBodyAsString;
    var komojuSignature = request.httpHeaders['x-komoju-signature'];
    var webhookCallVerified = komojuHelper.verifyWebhookCall(bodyToEncode, komojuSignature);

    var komojuOrder = OrderMgr.searchOrder('custom.komojuSessionId = {0}', sessionIdKomoju);
    if (komojuOrder) {
        if (webhookCallVerified) {
            var orderStatus = komojuOrder.getStatus().toString();
            Transaction.wrap(function () {
                var paymentInstrument;
                if (orderStatus === 'NEW' || orderStatus === 'OPEN') {
                    OrderMgr.cancelOrder(komojuOrder);
                } else if (orderStatus === 'CREATED') {
                    OrderMgr.failOrder(komojuOrder);
                }
                paymentInstrument = komojuOrder.getPaymentInstruments();
                paymentInstrument[0].custom.transactionStatus = body.data.status;
                komojuOrder.setPaymentStatus(0);
            });
        } else {
            customKomojuErrors.error(Resource.msgf('authentication.code.mismatch', 'komojuPayment', null, body.type, komojuOrder.orderNo));
        }
    }
    res.renderJSON({
        data: true
    });
    return;
}

exports.KomojuOrder = guard.ensure(['get'], KomojuOrder);
exports.geturl = guard.ensure(['get'], geturl);
exports.HandleWebHooksRefund = guard.ensure(['post'], HandleWebHooksRefund);
exports.HandleWebHooksCancelled = guard.ensure(['post'], HandleWebHooksCancelled);
exports.HandleWebHooksCaptureComplete = guard.ensure(['post'], HandleWebHooksCaptureComplete);
exports.HandleWebHooksPaymentAuthorized = guard.ensure(['post'], HandleWebHooksPaymentAuthorized);
exports.HandleWebHooksExpired = guard.ensure(['post'], HandleWebHooksExpired);
