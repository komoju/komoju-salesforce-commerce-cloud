var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');
var KomojuService = LocalServiceRegistry.createService('KomojuService', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('POST');
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
