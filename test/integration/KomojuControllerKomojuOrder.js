/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const chai = require('chai');
const request = require('request-promise');
const chaiSubset = require('chai-subset');
const { assert } = chai;
const {
    baseUrl,
    productId
} = require('../it.config');
const sinon = require('sinon');
chai.use(chaiSubset);
const oredermodal = require('../mocks/order').Order;
const basketemodal = require('../mocks/basket.js').basket;
var Logger = require('../mocks/logger');
var proxyquire = require('proxyquire').noCallThru();
var komoju = proxyquire(
    '../../cartridges/int_komoju_sfra/cartridge/controllers/KomojuController', {
        server: { get: function () {},
            post: function () {},
            middleware: { https: '' },
            exports: function () {} },
        'dw/web/URLUtils': sinon.spy(),
        '*/cartridge/scripts/fetchDisplayName': {
            fetchDisplayName: function () {
                return 'Konbini';
            }
        },
        '*/cartridge/scripts/middleware/csrf': sinon.spy(),
        '*/cartridge/scripts/middleware/userLoggedIn': sinon.spy,
        '*/cartridge/scripts/middleware/consentTracking': sinon.spy(),
        '*/cartridge/scripts/util/collections': sinon.spy(),
        'dw/order/PaymentInstrument': sinon.spy(),
        'dw/order/PaymentMgr': sinon.spy(),
        'dw/order/PaymentStatusCodes': sinon.spy(),
        'dw/web/Resource': sinon.spy(),
        'dw/order/OrderMgr': {
            getOrder: function () {
                return sinon.spy();
            },
            searchOrder: function () {
                return oredermodal;
            }
        },
        'dw/system/Logger': new Logger(),
        'dw/system/Session': sinon.spy(),
        'dw/system/Transaction': sinon.spy(),
        '*/cartridge/scripts/services/komojuServiceCreateSession': {
            KomojuService: {
                getURL: function () {
                    return 'www.google.com';
                },
                setURL: function () {
                    return {
                        call: function () {
                            return {
                                result: {
                                    error: 0,
                                    status: 'OK'
                                }
                            };
                        } };
                },
                call: function () {
                    return {
                        result: {
                            error: 0,
                            status: 'OK'
                        }
                    };
                }
            } },
        '*/cartridge/scripts/services/komojuServiceGetResponse': {
            KomojuService: {
                getURL: function () {
                    return 'www.google.com';
                },
                setURL: function () {
                    return {
                        call: function () {
                            return {
                                result: {
                                    error: 0,
                                    status: 'OK'
                                }
                            };
                        } };
                },
                call: function () {
                    return {
                        result: {
                            error: 0,
                            object: { status: 'completed', payment: { status: 'captured' } },
                            status: 'OK'
                        }
                    };
                }
            } },
        '*/cartridge/scripts/komojuHelpers': {

            CreateSession: function () {
                return { error: false };
            },
            setinstruments: function () {
                return { error: false };
            },
            cancelOrder: function () {
                return { error: false };
            },
            undoFail: function () { return { error: false }; }
        },
        'dw/order/BasketMgr': { getCurrentBasket: function () {
        // sinon.spy();
            return basketemodal;
        } },
        '*/cartridge/scripts/hooks/fraudDetection': { fraudDetection: function () {
            return 0;
        }


        },
        '*/cartridge/scripts/helpers/hooks': { error: false },
        '*/cartridge/scripts/hooks/validateOrder': { validateOrder: function () {} },

        '*/cartridge/scripts/checkout/checkoutHelpers': { validatePayment: function () {},

            calculatePaymentTransaction: function () {

            },
            createOrder: function () {
                return { custom: '' };
            },
            sendConfirmationEmail: function () { return null; },
            placeOrder: function () { return null; } },
        '*/cartridge/scripts/helpers/basketValidationHelpers': {}

    }

    );

describe('submitshippng', function () {
    this.timeout(200000);

    describe('main komoju controller  ', function () {
        it('should return status 200 on get-url route', function () {
            const cookieJar = request.jar();
            const myRequest = {
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                url: baseUrl + '/Cart-AddProduct',
                form: {
                    pid: productId,
                    quantity: 2
                }
            };

            return request(myRequest)
                .then(function (res) {
                    assert.equal(res.statusCode, 200, 'Expected add to Cart request statusCode to be 200');
                    const reqData = Object.assign({}, myRequest);
                    myRequest.url = baseUrl + '/CSRF-Generate';
                    cookieJar.setCookie(request.cookie(cookieJar.getCookieString(reqData.url), reqData.url));
                    return request(myRequest);
                })
                .then(function (res) {
                    const reqData = Object.assign({}, myRequest);
                    const csrfJsonResponse = JSON.parse(res.body);
                    reqData.url = baseUrl + '/CheckoutShippingServices-SubmitShipping';
                    reqData.form = {
                        [csrfJsonResponse.csrf.tokenName]: csrfJsonResponse.csrf.token,
                        shipmentSelector: 'new',
                        dwfrm_shipping_shippingAddress_addressFields_firstName: 'Rick',
                        dwfrm_shipping_shippingAddress_addressFields_lastName: 'Flores',
                        dwfrm_shipping_shippingAddress_addressFields_address1: '2253  Hudson Street',
                        dwfrm_shipping_shippingAddress_addressFields_address2: '',
                        dwfrm_shipping_shippingAddress_addressFields_country: 'US',
                        dwfrm_shipping_shippingAddress_addressFields_states_stateCode: 'AS',
                        dwfrm_shipping_shippingAddress_addressFields_city: 'Denver',
                        dwfrm_shipping_shippingAddress_addressFields_postalCode: '80207',
                        dwfrm_shipping_shippingAddress_addressFields_phone: '973-974-7269',
                        dwfrm_shipping_shippingAddress_shippingMethodID: '012',
                        dwfrm_billing_shippingAddressUseAsBillingAddress: 'true'
                    };
                    cookieJar.setCookie(request.cookie(cookieJar.getCookieString(reqData.url), reqData.url));
                    return request(reqData);
                })
                .then(async function () {
                    myRequest.method = 'GET';
                    const reqData = Object.assign({}, myRequest);
                   // const csrfJsonResponse = JSON.parse(res.body);
                    reqData.url = baseUrl + '/KomojuController-geturl';
                    cookieJar.setCookie(request.cookie(cookieJar.getCookieString(reqData.url), reqData.url));
                    return request(reqData);
                })
                .then(function (res) {
                    return res;
                });
        });
        it('handles redirects from the komju platform ', function () {
            const cookieJar = request.jar();
            const myRequest = {
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                url: baseUrl + '/Cart-AddProduct',
                form: {
                    pid: productId,
                    quantity: 2
                }
            };

            return request(myRequest)
                .then(function (res) {
                    assert.equal(res.statusCode, 200, 'Expected add to Cart request statusCode to be 200');
                    const reqData = Object.assign({}, myRequest);
                    myRequest.url = baseUrl + '/CSRF-Generate';
                    cookieJar.setCookie(request.cookie(cookieJar.getCookieString(reqData.url), reqData.url));
                    return request(myRequest);
                })
                .then(function (res) {
                    const reqData = Object.assign({}, myRequest);
                    const csrfJsonResponse = JSON.parse(res.body);
                    reqData.url = baseUrl + '/CheckoutShippingServices-SubmitShipping';
                    reqData.form = {
                        [csrfJsonResponse.csrf.tokenName]: csrfJsonResponse.csrf.token,
                        shipmentSelector: 'new',
                        dwfrm_shipping_shippingAddress_addressFields_firstName: 'Rick',
                        dwfrm_shipping_shippingAddress_addressFields_lastName: 'Flores',
                        dwfrm_shipping_shippingAddress_addressFields_address1: '2253  Hudson Street',
                        dwfrm_shipping_shippingAddress_addressFields_address2: '',
                        dwfrm_shipping_shippingAddress_addressFields_country: 'US',
                        dwfrm_shipping_shippingAddress_addressFields_states_stateCode: 'AS',
                        dwfrm_shipping_shippingAddress_addressFields_city: 'Denver',
                        dwfrm_shipping_shippingAddress_addressFields_postalCode: '80207',
                        dwfrm_shipping_shippingAddress_addressFields_phone: '973-974-7269',
                        dwfrm_shipping_shippingAddress_shippingMethodID: '012',
                        dwfrm_billing_shippingAddressUseAsBillingAddress: 'true'
                    };
                    cookieJar.setCookie(request.cookie(cookieJar.getCookieString(reqData.url), reqData.url));
                    return request(reqData);
                })
                .then(async function () {
                    myRequest.method = 'GET';
                    const reqData = Object.assign({}, myRequest);
                    reqData.url = baseUrl + '/KomojuController-KomojuOrder?session_id=5ywoyd6do8kuk4boxkm3kqls4';
                    cookieJar.setCookie(request.cookie(cookieJar.getCookieString(reqData.url), reqData.url));
                    return request(reqData);
                })
                .then(async function (res) {
                    return await res;
                });
        });
    });
});

describe('Handle Refund endpoint', function () {
    this.timeout(50000);

    it('Should be error', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: {
                data: { id: 'blvuxwuvffh63bkp0aidp5jyg', status: 'refunded' }
            },
            json: true
        };

        myRequest.url = baseUrl + '/KomojuController-HandleWebHooksRefund';
        return request(myRequest)
            .then(async function (refundResponse) {
                assert.equal(refundResponse.statusCode, 200, 'Expected statusCode to be 200.');
            });
    });
});
