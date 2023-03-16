(function () {
    /**
     * It runs when we toggle the button of komoju payment methods from the BM module
     */
    function initialize() {
        // Initialize tree
        var $ = jQuery;
        $('.togglePaymentMethod').on('click', function () {
            let form = {};
            let controllerUrl = this.value;
            form.komojuPaymentMethodId = this.id;
            form.checked = this.checked;
            form.currency = $(this).attr('data-currency');

            $.ajax({
                url: controllerUrl,
                type: 'post',
                data: form,
                datatype: 'json',
                context: this,
                success: function () {
                    console.log('success');
                    console.log('Payment method updated');
                },
                error: function () {
                    console.log('error occured');
                }
            });
        });
        $('.secretKeySaveBtn').on('click', function () {
            let form = {};
            let controllerUrl = this.value;
            form.komojuSecretKey = $('#komojuSecretKey')[0].value;

            $.ajax({
                url: controllerUrl,
                type: 'post',
                data: form,
                datatype: 'json',
                context: this,
                success: function () {
                    console.log('success');
                    console.log('Secret key updated');
                    window.location.reload();
                },
                error: function () {
                    console.log('error occured');
                }
            });
        });
        $('.emailUpdateBtn').on('click', function () {
            let form = {};
            let controllerUrl = this.value;
            form.komojuEmail = $('#komojuEmail')[0].value;
            var validRegex = /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/g;

            if ($('#komojuEmail')[0].value.match(validRegex)) {
                $.ajax({
                    url: controllerUrl,
                    type: 'post',
                    data: form,
                    datatype: 'json',
                    context: this,
                    success: function () {
                        console.log('Merchant email updated');
                        console.log('success');
                        window.location.reload();
                    },
                    error: function () {
                        console.log('error occured');
                    }
                });
            } else {
                alert('Invalid email address!');
            }
        });
        $('.emailToggleValue').on('click', function () {
            let form = {};
            let controllerUrl = this.value;
            form.emailToggleValue = this.checked;

            $.ajax({
                url: controllerUrl,
                type: 'post',
                data: form,
                datatype: 'json',
                context: this,
                success: function () {
                    console.log('Merchant email functionality updated');
                    console.log('success');
                },
                error: function () {
                    console.log('error occured');
                }
            });
        });
        $('.codeUpdateBtn').on('click', function () {
            let form = {};
            let controllerUrl = this.value;
            form.webhooksAuthenticationCode = $('#webhooksAuthenticationCode')[0].value;

            $.ajax({
                url: controllerUrl,
                type: 'post',
                data: form,
                datatype: 'json',
                context: this,
                success: function () {
                    console.log('authentication code updated');
                    console.log('success');
                    window.location.reload();
                },
                error: function () {
                    console.log('error occured');
                }
            });
        });
        $('.copyWebhook').on('click', function () {
            let elementID = this.id;
            let clsSuffix = elementID.slice(4);
            let webHookCls = 'copy' + clsSuffix;

            let currentWebhookContent = document.getElementsByClassName(webHookCls)[0].innerText;

            try {
                navigator.clipboard.writeText(currentWebhookContent);
                $('.copy_to_clipboard_message').css('display', 'block');
                setTimeout(() => {
                    $('.copy_to_clipboard_message').css('display', 'none');
                }, 3000);
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        });
        $("#methodTable").sortable({
            items: 'tr',
            cursor: 'pointer',
            axis: 'y',
            dropOnEmpty: false,
            start: function (e, ui) {
                ui.item.addClass("selected");
                ui.item.children().eq(0).addClass("iconOnDrag");
                ui.item.children().eq(1).addClass("dragNameCurrency");
                ui.item.children().eq(2).addClass("dragCurrency");
                ui.item.children().eq(3).addClass("dragMethodImage");
                ui.item.children().eq(4).addClass("toggleButton");
            },
            stop: function (e, ui) {
                ui.item.removeClass("selected");
                ui.item.children().eq(0).removeClass("iconOnDrag");
                ui.item.children().eq(1).removeClass("dragNameCurrency");
                ui.item.children().eq(2).removeClass("dragCurrency");
                ui.item.children().eq(3).removeClass("dragMethodImage");
                ui.item.children().eq(4).removeClass("toggleButton");
                komojuAllPaymentMethods = {};
                $(this).find("tr").each(function (index) {
                    if(index > 0){
                        komojuAllPaymentMethods[index] = $(this).find("td").eq(1).attr('data-komoju-method-id')+$(this).find("td").eq(1).attr('data-komoju-method-currency');
                    }
                });
                var changeOrderPaymentMethodsUrl = $('.changeOrderPaymentMethods').attr('data-update-payment-method-order-url');
                $.ajax({
                    url: changeOrderPaymentMethodsUrl,
                    type: 'post',
                    data: komojuAllPaymentMethods,
                    datatype: 'json',
                    context: this,
                    success: function () {
                        console.log('success');
                    },
                    error: function () {
                        console.log('error occured');
                    }
                });
            }
        });
    }
    initialize();
}());
