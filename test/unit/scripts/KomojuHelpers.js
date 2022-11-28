/* eslint-disable no-undef */

'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
// const Order =require('../../mocks/order').Order;
const basketemodal = require('../../mocks/basket.js').basket;

var urlStub = sinon.stub();
var getPrivacyCacheStub = sinon.stub();
var mockedAuthStatus = 'AUTH_OK';


describe('komojuHelpers', function () {
    var komojuHelper = proxyquire('../../../cartridges/int_komoju/cartridge/scripts/komojuHelpers', {
        'dw/system/Transaction': {
            wrap: function (callback) {
                return callback();
            }
        },
        'dw/customer/CustomerMgr': {
            authenticateCustomer: function () {
                return { status: mockedAuthStatus, customer: { }, loginCustomer: function () {} };
            },
            loginCustomer: function () {}
        },
        'dw/web/URLUtils': sinon.spy(),
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
            undoFailOrder: function () { return 'ERROR'; }

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
        setinstruments: function () {
            return { error: false };
        },
        cancelOrder: function () {
            return { error: false };
        },
        undoFail: function () { return { error: false }; },
        deletebasketifpresent: function () {
            return { error: false };
        },
        'dw/order/BasketMgr': { getCurrentBasket: function () {
          // sinon.spy();
            return basketemodal;
        } },
        'dw/system/Logger': { warn: function () { return true; } },
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
            createOrder: function () {
                return { custom: '' };
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

    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{paypay} ', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'paypay' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());

        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{payeasy}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'payeasy' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{pay_easy}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'pay_easy' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());

        assert.deepEqual(result, true);
    });

    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{credit_card}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'credit_card', brand: 'visa' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });

    it('expected to throw error from failorder function', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'credit_card', brand: 'visa' } } } };
        const Order = require('../../mocks/order');

        expect(komojuHelper.failorder.bind(komojuHelper, obj, new Order())).to.throw('');
    });

    it('expected to throw error from cancelOrder function', function () {
        getPrivacyCacheStub.returns(null);
        const Order = require('../../mocks/order');
        var fraudDetection = {};

        expect(komojuHelper.cancelOrder.bind(komojuHelper, new Order(), fraudDetection)).to.throw('');
    });
    it('expected to throw error from undoFail function', function () {
        getPrivacyCacheStub.returns(null);

        const Order = require('../../mocks/order');

        expect(komojuHelper.undoFail.bind(komojuHelper, new Order())).to.throw('');
    });


    it('expected error from  deletebasketifpresent funcrtion to be false', function () {
        getPrivacyCacheStub.returns(null);
        var CurrentBaskettemp = require('../../mocks/basket');

        var result = komojuHelper.deletebasketifpresent(new CurrentBaskettemp());


        assert.deepEqual(result.error, false);
    });

    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{linepay}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'linepay' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{konbini}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'konbini' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{merpay}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'merpay' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{bank_transfer}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'bank_transfer' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{payeasy}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'payeasy' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{net_cash}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'net_cash', prepaid_cards: ['0000000000000000'] } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());

        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{web_money}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'web_money', prepaid_cards: ['0000000000000000'] } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{bancontact}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'bancontact' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{giropay}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'giropay' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{ideal}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'ideal' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{paidy}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'paidy' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{sofortbanking}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'sofortbanking' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{bit_cache}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'bit_cache' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
    it('should return result as no error by calling setinstrument function of  komojuhelpers payment method:{mobile}', function () {
        getPrivacyCacheStub.returns(null);
        var obj = { object: { payment: { payment_details: { type: 'mobile' } } } };
        const Order = require('../../mocks/order');
        var result = komojuHelper.setinstruments(obj, new Order());


        assert.deepEqual(result, true);
    });
});
