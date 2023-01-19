/**
 * return the display name of komoju Id
 * @param {Object} allMethods contains the payment methods from custom object
 * @param {string} komojuMethodId contains the komoju payment type id
 * @param {string} locale locale of the site
 * @returns {string} the display name of method
 */
function fetchDisplayName(allMethods, komojuMethodId, locale) {
    var currentMethodDisplayName = '';
    Object.keys(allMethods).forEach(function (key) {
        var currentPaymentMethod = allMethods[key];
        Object.keys(currentPaymentMethod).forEach(function (paymentMethodKey) {
            var object = currentPaymentMethod[paymentMethodKey];
            if (komojuMethodId === object.id) {
                currentMethodDisplayName = object.displayValue[locale];
                return;
            }
        });
    });
    return currentMethodDisplayName;
}

module.exports = {
    fetchDisplayName: fetchDisplayName
};
