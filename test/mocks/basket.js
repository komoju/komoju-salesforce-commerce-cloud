
'use strict';

var SuperPrototype = require('./LineItemCtnr');

var Basket = function () {};
Basket.prototype = new SuperPrototype();
Basket.prototype.getOrderBeingEdited = function () {};
Basket.prototype.getOrderNoBeingEdited = function () {};
Basket.prototype.orderBeingEdited = null;
Basket.prototype.orderNoBeingEdited = null;

module.exports = Basket;
