
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');

var KomojuService = LocalServiceRegistry.createService('KomojuService', {
    createRequest: function (svc, params) {
        var count = params.order.custom.count;
        var uurl = svc.getURL();
        var id = params.order.custom.sessionidkomoju;
        if (count == null || count === '1.0') {
            uurl = uurl + '/' + id;
            Transaction.wrap(function () {
                params.order.custom.count = 1;
                params.order.custom.sessionidperma = params.order.custom.sessionidkomoju;
            });
        }
        svc.setURL(uurl);
        svc.setRequestMethod('GET');
        var formBody = [];
        var credential = svc.getConfiguration().getCredential();
        Object.keys(params).forEach((key) => {
            if (key) {
                var encodedKey = encodeURIComponent(key);
                var encodedValue = encodeURIComponent(params[key]);
                formBody.push(encodedKey + '=' + encodedValue);
            }
        });
        formBody = formBody.join('&');
        svc.setAuthentication('NONE');
        svc.addHeader('Authorization', 'Basic ' + StringUtils.encodeBase64(credential.user));
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
    }
});

module.exports = {
    KomojuService: KomojuService
};
