$(document).ready(function () {
    $('#methodNotSupported').css('display', 'none');
    setTimeout(function () {
        $('.alert.alert-danger.PlaceOrderError').hide();
    }, 5000);

    $('form.submit-order').submit(function (event) {
        var selectedPaymentMethod = $('.selectedPaymentKomojuGeturl').attr('data-selectedmethod');
        if (selectedPaymentMethod === 'KOMOJU_HOSTED_PAGE') {
            event.preventDefault();
            var dataIdgeturl = $('.urlkomojugeturl').attr('data-url');
            $.ajax({
                url: dataIdgeturl,
                type: 'GET',
                success: function (data) {
                    if (data.sessionURL) {
                        window.location.assign(data.sessionURL);
                    }
                    if (data.komojuMethodError) {
                        $('#methodNotSupported').show();
                        setTimeout(function () {
                            $('.alert.alert-danger.PlaceOrderError').hide();
                        }, 5000);
                    }
                }
            });
        }
    });
});
