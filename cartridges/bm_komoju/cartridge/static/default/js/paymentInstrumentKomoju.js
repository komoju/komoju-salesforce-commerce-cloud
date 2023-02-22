

(function () {
    /**
     * It is used to manipulate the komoju payment instruments on payments tab of a order
     */
    function initialize() {
        // Initialize tree
        var $ = jQuery;
        $('.komoju-transaction-table').parent().hide();
        var grandParent = jQuery('.komoju-transaction-table').parent().parent();
        grandParent.append(jQuery('.komoju-transaction-table').html());
    }
    initialize();
}());
