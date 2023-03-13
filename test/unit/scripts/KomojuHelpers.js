/* eslint-disable no-undef */

'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
// const Order =require('../../mocks/order').Order;
const basketemodal = require('../../mocks/basket.js').basket;
var Order = require('../../mocks/order');
var Logger = require('../../mocks/logger');
var urlStub = sinon.stub();
var getPrivacyCacheStub = sinon.stub();
var mockedAuthStatus = 'AUTH_OK';
var Mockcustomobjmgr = require('../../mocks/mockcustomobj.js');
var Mac = require('../../mocks/Mac.js');
var Crypto = require('../../mocks/Crypto.js');

describe('komojuHelpers', function () {
    var komojuHelper = proxyquire('../../../cartridges/int_komoju_common/cartridge/scripts/komojuHelpers', {
        'dw/system/Transaction': {
            wrap: function (callback) {
                return callback.call();
            }
        },
        'dw/util/Currency': {
            getCurrency: function () {
                return 'currency';
            }
        },
        'dw/customer/CustomerMgr': {
            authenticateCustomer: function () {
                return { status: mockedAuthStatus, customer: { }, loginCustomer: function () {} };
            },
            loginCustomer: function () {}
        },
        'dw/web/URLUtils': sinon.spy(),
        'dw/system/Logger': new Logger(),
        '*/cartridge/scripts/middleware/csrf': sinon.spy(),
        '*/cartridge/scripts/middleware/userLoggedIn': sinon.spy,
        '*/cartridge/scripts/middleware/consentTracking': sinon.spy(),
        '*/cartridge/scripts/util/collections': require('../../mocks/util/collection'),
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
            },
            failOrder: function () {
                return 'ERROR';
            },
            cancelOrder: function () { return 'ERROR'; },
            undoFailOrder: function (order) {
                if (!order) {
                    return true;
                }
                return 'ERROR';
            },
            createOrder: function () { return new Order(); }

        },
        'dw/system/Status': { ERROR: 'ERROR' },
        'dw/system/Session': sinon.spy(),
        '*/cartridge/services/komojuServiceCreateSession': {
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
        '*/cartridge/services/komojuServiceCancelSession': {
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
        'dw/object/CustomObjectMgr': new Mockcustomobjmgr(),
        'dw/crypto/Mac': Mac,
        'dw/crypto': new Crypto(),
        setinstruments: function () {
            return { error: false };
        },
        setInstrumentFromAuthorizeWebHook: function () {
            return { error: false };
        },
        cancelOrder: function () {
            return { error: false };
        },
        undoFail: function () { return { error: false }; },
        'dw/order/BasketMgr': { getCurrentBasket: function () {
          // sinon.spy();
            return basketemodal;
        } },
        '*/cartridge/scripts/hooks/fraudDetection': { fraudDetection: function () {
            return 0;
        }


        },

      // var URLUtils = require('dw/web/URLUtils');
        '*/cartridge/scripts/helpers/basketCalculationHelpers': {},
        '*/cartridge/scripts/helpers/hooks': { error: false },
        '*/cartridge/scripts/hooks/validateOrder': { validateOrder: function () {} },

        '*/cartridge/scripts/checkout/checkoutHelpers': { validatePayment: function () {},

            calculatePaymentTransaction: function () {

            },
            sendConfirmationEmail: function () { return null; },
            placeOrder: function () { return null; } },
        '*/cartridge/scripts/helpers/basketValidationHelpers': {}

    });


    beforeEach(function () {
        urlStub.reset();
        urlStub.returns({
            relative: function () {
                return {
                    toString: function () {
                        return 'string url';
                    }
                };
            }
        });
        getPrivacyCacheStub.reset();
    });

    it('should return no error and status OK create session service for komoju', function () {
        getPrivacyCacheStub.returns(null);

        var result = komojuHelper.createSession();
        assert.deepEqual(result, { result: { error: 0, status: 'OK' } });
    });

    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{credit_card}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'credit_card', brand: 'visa', last_four_digits: '4242', year: '2026', month: 10 }, currency: 'JPY', payment_method_fee: 1013.2345 }, currency: 'JPY' } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{konbini}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'konbini', store: 'seven-eleven' }, currency: 'JPY', payment_method_fee: 1013.2345 }, currency: 'USD' } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{paypay} ', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'paypay' }, currency: 'JPY', payment_method_fee: 1013.2345 }, currency: 'USD' } };

        var result = komojuHelper.setinstruments(obj, new Order());

        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{payeasy}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'payeasy' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{pay_easy}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'pay_easy' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());

        assert.deepEqual(result, true);
    });


    it('expected to throw error from failorder function', function () {
        getPrivacyCacheStub.returns(null);
        expect(komojuHelper.failorder.bind(komojuHelper, new Order())).to.throw('');
    });

    it('expected to throw error from cancelOrder function', function () {
        getPrivacyCacheStub.returns(null);

        var fraudDetection = {};

        expect(komojuHelper.cancelOrder.bind(komojuHelper, new Order(), fraudDetection)).to.throw('');
    });
    it('expected to throw error from undoFail function', function () {
        getPrivacyCacheStub.returns(null);


        expect(komojuHelper.undoFail.bind(komojuHelper, new Order())).to.throw('');
    });
    it('expected to not throw error from undoFail function', function () {
        getPrivacyCacheStub.returns(null);


        expect(komojuHelper.undoFail.bind(komojuHelper)).to.not.throw();
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{linepay}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'linepay' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });

    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{merpay}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'merpay' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{bank_transfer}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'bank_transfer' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{payeasy}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'payeasy' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{net_cash}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'net_cash', prepaid_cards: [{ last_four_digits: '1000' }] }, currency: 'JPY', payment_method_fee: 1013.2345 }, currency: 'USD' } };

        var result = komojuHelper.setinstruments(obj, new Order());

        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{net_cash} and prepaid card is not defined', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'net_cash', prepaid_cards: [] }, currency: 'JPY', payment_method_fee: 1013.2345 }, currency: 'USD' } };

        var result = komojuHelper.setinstruments(obj, new Order());

        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{web_money}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'web_money', prepaid_cards: [{ last_four_digits: '1000' }] }, currency: 'JPY', payment_method_fee: 1013.2345 }, currency: 'USD' } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{web_money} and prepaid card is not defined', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'web_money', prepaid_cards: [] }, currency: 'JPY', payment_method_fee: 1013.2345 }, currency: 'USD' } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{bancontact}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'bancontact' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{giropay}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'giropay' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{ideal}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'ideal' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{paidy}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'paidy' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{sofortbanking}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'sofortbanking' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{bit_cache}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'bit_cache' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{mobile}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'mobile' } } } };

        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setInstrumentFromAuthorizeWebHook function of  komojuhelpers payment method:{konbini}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { data: { payment_details: { type: 'konbini' }, payment_method_fee: 1013.2345, amount: 1013.2345 } };

        var result = komojuHelper.setInstrumentFromAuthorizeWebHook(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setInstrumentFromAuthorizeWebHook function of  komojuhelpers payment method:{bank_transfer}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { data: { payment_details: { type: 'bank_transfer' }, payment_method_fee: 1013.2345, amount: 1013.2345 } };

        var result = komojuHelper.setInstrumentFromAuthorizeWebHook(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('returns available payment methods', function () {
        getPrivacyCacheStub.returns(null);

        var result = komojuHelper.returnArrayOfObj();
        var check = [{ currency: 'JPY', id: 'konbini', enabled: true }];

        assert.deepEqual(result, check);
    });
    it('verify the webhooks call', function () {
        getPrivacyCacheStub.returns(null);
        var body = { status: 'ok' };
        var komojuSignature = 'asde7b9e4d1473ed923ed2ff54de344fbff54e622052c95980c7f96985d10defc18';
        var result = komojuHelper.verifyWebhookCall(body, komojuSignature);
        // var check = { c_availablePaymenrMethods: [{ method1: { id: 'konbini', displayValue: { en: 'Konbini', ja: 'コンビニ', ko: '편의점' }, enabled: true, currency: 'JPY' } }] };

        assert.deepEqual(result, true);
    });
    it('webhooks signature unequaled', function () {
        getPrivacyCacheStub.returns(null);
        var body = { status: 'ok' };
        var komojuSignature = 'wrong';
        var result = komojuHelper.verifyWebhookCall(body, komojuSignature);
        // var check = { c_availablePaymenrMethods: [{ method1: { id: 'konbini', displayValue: { en: 'Konbini', ja: 'コンビニ', ko: '편의점' }, enabled: true, currency: 'JPY' } }] };

        assert.deepEqual(result, false);
    });
    it('creates order ', function () {
        getPrivacyCacheStub.returns(null);
        var tempOrderNumber = '0000321';
        var CurrentBaskettemp = require('../../mocks/basket');
        var result = komojuHelper.createOrder(new CurrentBaskettemp(), tempOrderNumber);
        var check = new Order();
        assert.equal(typeof result, typeof check);
    });
    it('creates order without order no.', function () {
        getPrivacyCacheStub.returns(null);
        var tempOrderNumber = '';
        var CurrentBaskettemp = require('../../mocks/basket');
        var result = komojuHelper.createOrder(new CurrentBaskettemp(), tempOrderNumber);
        var check = new Order();
        assert.equal(typeof result, typeof check);
    });
});
