$(document).ready(function () {
    $('form.checkout-billing').submit(function (event) {
        if ($('.payment-method.payment-method-expanded').attr('data-method') === 'KOMOJU_HOSTED_PAGE') {
            var $form = $('.checkout-billing');
            event.preventDefault();
            var submitPaymentMethodUrl = $('.submitPaymentMethodUrl').attr('data-myurl');
            $.ajax({
                url: $form.attr('action'),
                type: 'GET',
                data: $form.serialize(),
                success: function () {
                    window.location.assign(submitPaymentMethodUrl);
                }
            });
        }
    });
});
