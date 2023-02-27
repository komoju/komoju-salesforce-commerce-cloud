'use strict';

/**
 * This controller implements the last step of the checkout. A successful handling
 * of billing address and payment method selection leads to this controller. It
 * provides the customer with a last overview of the basket prior to confirm the
 * final order creation.
 *
 * @module controllers/COSummary
 */

/* API Includes */
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var BasketMgr = require('dw/order/BasketMgr');

var Cart = app.getModel('Cart');


/**
 * @param {string} methodId selected komoju payment method type id
 * @return {string} Display name of selected payment method type.
 */
function getDisplayName(methodId) {
    var locale = request.locale;
    if (locale.length > 2) {
        locale = locale.slice(0, 2);
    }
    if (locale !== 'ja' && locale !== 'ko') {
        locale = 'en';
    }
    var komojuCustomObject = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1);
    var availablePaymentMethods = komojuCustomObject.custom.availableKomojuPaymentMethods;
    var jsonAvailablePaymentMethods;
    var methodDisplayName = '';
    try {
        jsonAvailablePaymentMethods = JSON.parse(availablePaymentMethods);
    } catch (e) {
        Logger.error('error in parsing payment methods from site preference availablePaymentMethods ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }
    if (jsonAvailablePaymentMethods) {
        var allMethods = jsonAvailablePaymentMethods.c_availablePaymentMethods;
        Object.keys(allMethods).forEach(function (key) {
            var currentPaymentMethod = allMethods[key];
            Object.keys(currentPaymentMethod).forEach(function (paymentMethodKey) {
                var object = currentPaymentMethod[paymentMethodKey];
                if (object.id === methodId) {
                    methodDisplayName = object.displayValue[locale];
                }
            });
        });
    }
    return methodDisplayName;
}

/**
 * Renders the summary page prior to order creation.
 * @param {Object} context context object used for the view
 */
function start(context) {
    var cart = Cart.get();
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket === null) {
        response.redirect(URLUtils.https('KomojuController-KomojuOrder'));
        return;
    }

    // Checks whether all payment methods are still applicable. Recalculates all existing non-gift certificate payment
    // instrument totals according to redeemed gift certificates or additional discounts granted through coupon
    // redemptions on this page.
    var COBilling = app.getController('COBilling');
    if (!COBilling.ValidatePayment(cart)) {
        COBilling.Start();
        return;
    }
    Transaction.wrap(function () {
        cart.calculate();
    });

    Transaction.wrap(function () {
        if (!cart.calculatePaymentTransactionTotal()) {
            COBilling.Start();
        }
    });

    var pageMeta = require('*/cartridge/scripts/meta');
    var viewContext = require('*/cartridge/scripts/common/extend').immutable(context, {
        Basket: cart.object,
        method: currentBasket.custom.komojuPaymentMethodType ? getDisplayName(currentBasket.custom.komojuPaymentMethodType) : null,
        fallBackMessage: context ? context.fallBackMessage : null
    });
    pageMeta.update({ pageTitle: Resource.msg('summary.meta.pagetitle', 'checkout', 'SiteGenesis Checkout') });
    app.getView(viewContext).render('checkout/summary/summary');
}


/**
 * Renders the order confirmation page after successful order
 * creation. If a nonregistered customer has checked out, the confirmation page
 * provides a "Create Account" form. This function handles the
 * @param {Object} order contains the orders
 * account creation.
 */
function showConfirmation(order) {
    var paymentMethod = order.paymentInstrument.custom.komojuPaymentMethodType;
    var transactionStatus = order.paymentInstrument.custom.transactionStatus;
    if (!customer.authenticated) {
        // Initializes the account creation form for guest checkouts by populating the first and last name with the
        // used billing address.
        var customerForm = app.getForm('profile.customer');
        customerForm.setValue('firstname', order.billingAddress.firstName);
        customerForm.setValue('lastname', order.billingAddress.lastName);
        customerForm.setValue('email', order.customerEmail);
        customerForm.setValue('orderNo', order.orderNo);
        customerForm.setValue('orderUUID', order.getUUID());
    }

    app.getForm('profile.login.passwordconfirm').clear();
    app.getForm('profile.login.password').clear();

    var pageMeta = require('*/cartridge/scripts/meta');
    pageMeta.update({ pageTitle: Resource.msg('confirmation.meta.pagetitle', 'checkout', 'SiteGenesis Checkout Confirmation') });
    app.getView({
        paymentMethod: getDisplayName(paymentMethod),
        Order: order,
        transactionStatus: transactionStatus,
        ContinueURL: URLUtils.https('Account-RegistrationForm') // needed by registration form after anonymous checkouts
    }).render('checkout/confirmation/confirmation');
}


/**
 * This function is called when the "Place Order" action is triggered by the
 * customer.
 */
function submit() {
    // Calls the COPlaceOrder controller that does the place order action and any payment authorization.
    // COPlaceOrder returns a JSON object with an order_created key and a boolean value if the order was created successfully.
    // If the order creation failed, it returns a JSON object with an error key and a boolean value.
    var placeOrderResult = app.getController('COPlaceOrder').Start();
    if (placeOrderResult.error) {
        start({
            PlaceOrderError: placeOrderResult.PlaceOrderError
        });
    } else if (placeOrderResult.order_created) {
        showConfirmation(placeOrderResult.Order);
    }
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/COSummary~Start */
exports.Start = guard.ensure(['https'], start);
/** @see module:controllers/COSummary~Submit */
exports.Submit = guard.ensure(['https', 'post', 'csrf'], submit);

/*
 * Local method
 */
exports.ShowConfirmation = showConfirmation;
