
/* eslint-disable no-undef */

const chai = require('chai');
const request = require('request-promise');
const chaiSubset = require('chai-subset');
const { assert } = chai;
const {
    baseUrl,
    productId
} = require('../it.config');
chai.use(chaiSubset);

describe('submitshippng', function () {
    this.timeout(20000);

    describe('if checkout from billing page', function () {
        it('should return purchase unit with shipping address include', function () {
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

                .then(function (res) {
                    return JSON.parse(res.body);
                });
        });
    });
});

