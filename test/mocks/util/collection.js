'use strict';
/**
 * map utility.

 * @returns {number} The sum of the two numbers.
 */
function map() {
    var args = Array.from(arguments);
    var list = args[0];
    var callback = args[1];
    if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
        list = list.toArray();
    }
    return list ? list.map(callback) : [];
}
/**
 * find utility
 * @param {number} num1 The find number.
 * @returns {number} sdearched.
 */
function find() {
    var args = Array.from(arguments);
    var list = args[0];
    var callback = args[1];
    if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
        list = list.toArray();
    }
    return list ? list.find(callback) : null;
}
/**
 * iteration.
 * @returns {callback} for each element.
 */
function forEach() {
    var args = Array.from(arguments);
    var list = args[0];
    var callback = args[1];
    if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
        list = list.toArray();
    }
    return list ? list.forEach(callback) : null;
}
/**
 * rescursive.
 * @returns {calback}.
 */
function every() {
    var args = Array.from(arguments);
    var list = args[0];
    var callback = args[1];
    if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
        list = list.toArray();
    }
    return list ? list.every(callback) : null;
}
/**
 * find first .
 * @returns {element} index is first.
 */
function first() {
    var args = Array.from(arguments);
    var list = args[0];
    if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
        list = list.toArray();
    }
    return list.length > 0 ? list[0] : null;
}

module.exports = {
    find: find,
    forEach: forEach,
    map: map,
    every: every,
    first: first
};
