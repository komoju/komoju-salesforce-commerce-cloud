

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var StringUtils = require('dw/util/StringUtils');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var komojuCustomObject = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1);

var refundKomoju = LocalServiceRegistry.createService('KOMOJUCancelAndRefundService', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('POST');

        var baseURL = svc.configuration.credential.URL;
        var customUrl = baseURL + '/payments/' + params + '/refund';
        var secretKey = komojuCustomObject.custom.komojuSecretKey;
        var authorization = StringUtils.encodeBase64(secretKey);

        svc.setURL(customUrl);
        svc.addHeader('Authorization', authorization);

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
    },
    filterLogMessage: function (msg) {
        return msg;
    }
});

module.exports = {
    refundKomoju: refundKomoju
};
