
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var komojuCustomObject = CustomObjectMgr.getCustomObject('komojuPaymentMethodsObjectType', 1);

var KomojuService = LocalServiceRegistry.createService('KOMOJUService', {
    createRequest: function (svc, params) {
        var secretKey = komojuCustomObject.custom.komojuSecretKey;
        var id = params.order.custom.komojuSessionId;

        var baseURL = svc.configuration.credential.URL;
        var customUrl = baseURL + '/sessions/' + id;

        svc.setURL(customUrl);
        svc.setRequestMethod('GET');
        var formBody = [];
        Object.keys(params).forEach((key) => {
            if (key) {
                var encodedKey = encodeURIComponent(key);
                var encodedValue = encodeURIComponent(params[key]);
                formBody.push(encodedKey + '=' + encodedValue);
            }
        });
        formBody = formBody.join('&');
        svc.setAuthentication('NONE');
        svc.addHeader('Authorization', 'Basic ' + StringUtils.encodeBase64(secretKey));
        svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
        return formBody;
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
    KomojuService: KomojuService
};
