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

describe('billingForm', function () {
    this.timeout(20000);

    describe('positive test', function () {
        it('shoukl', function () {
            var cookieJar = request.jar();

            var myRequest = {
                url: '',
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            var cookieString;


            var variantPid1 = productId;
            var qty1 = 2;
            var addProd = '/Cart-AddProduct';

        // ----- Step 1 adding product to Cart
            myRequest.url = baseUrl + addProd;
            myRequest.form = {
                pid: variantPid1,
                quantity: qty1
            };

            return request(myRequest)
            .then(function (addToCartResponse) {
                assert.equal(addToCartResponse.statusCode, 200, 'Expected add to Cart request statusCode to be 200.');
                cookieString = cookieJar.getCookieString(myRequest.url);
                myRequest.url = baseUrl + '/CSRF-Generate';
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                // step2 : get cookies, Generate CSRF, then set cookies
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                // step3 : submit billing request with token aquired in step 2
                myRequest.url = baseUrl + '/CheckoutServices-SubmitPayment?' +
                    csrfJsonResponse.csrf.tokenName + '=' +
                    csrfJsonResponse.csrf.token;
                myRequest.form = {
                    dwfrm_billing_shippingAddressUseAsBillingAddress: 'true',
                    dwfrm_billing_addressFields_firstName: 'John',
                    dwfrm_billing_addressFields_lastName: 'Smith',
                    dwfrm_billing_addressFields_address1: '10 main St',
                    dwfrm_billing_addressFields_address2: '',
                    dwfrm_billing_addressFields_country: 'us',
                    dwfrm_billing_addressFields_states_stateCode: 'MA',
                    dwfrm_billing_addressFields_city: 'burlington',
                    dwfrm_billing_addressFields_postalCode: '09876',
                    dwfrm_billing_paymentMethod: 'komoju',
                    dwfrm_billing_creditCardFields_cardType: 'Visa',
                    dwfrm_billing_creditCardFields_cardNumber: '4111111111111111',
                    dwfrm_billing_creditCardFields_expirationMonth: '2',
                    dwfrm_billing_creditCardFields_expirationYear: '2030.0',
                    dwfrm_billing_contactInfoFields_phone: '9786543213',
                    dwfrm_billing_creditCardFields_securityCode: '342'
                };
                return request(myRequest)
                    .then(function (response) {
                        assert.equal(response.statusCode, 200, 'Expected CheckoutServices-SubmitPayment statusCode to be 200.');
                    });
            });
        });
    });
});
