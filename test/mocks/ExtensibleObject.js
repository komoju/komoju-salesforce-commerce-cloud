var SuperPrototype = require('./PersistentObject');

var ExtensibleObject = function () {};

ExtensibleObject.prototype = new SuperPrototype();

ExtensibleObject.prototype.describe = function () {};
ExtensibleObject.prototype.getCustom = function () { return this.custom; };
ExtensibleObject.prototype.custom = {};

module.exports = ExtensibleObject;
