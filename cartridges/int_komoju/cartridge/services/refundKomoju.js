

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');

var refundKomoju = LocalServiceRegistry.createService('komojuCancelAndRefundService', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('POST');
        var baseURL = svc.configuration.credential.URL;

        var customUrl = baseURL + params + '/refund';

        svc.setURL(customUrl);
        svc.addHeader('Authorization', 'c2tfdGVzdF8zb3R5aTEwNHZxcTN2cTBhbWVxdzBsYmU6');

        return params;
    },
    parseResponse: function (svc, httpClient) {
        var result;

        try {
            result = JSON.parse(httpClient.text);
        } catch (e) {
            Logger.error(httpClient.text + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        }
        return result;
    }
});

module.exports = {
    refundKomoju: refundKomoju
};
