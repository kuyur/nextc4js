/**
 * @author kuyur@kuyur.info
 */

'use strict';

/**
 * @enum {string}
 */
var CharmapType = {
  FRONT_END: 'front-end',
  MEDIUM: 'medium',
  BACK_END: 'back-end'
};

/**
 * @constructor
 * @param {string} name
 * @param {CharmapType} type
 */
var Charmap = function(name, type) {
  this.name_ = name;
  this.type_ = type;
};

/**
 * @private
 * @type {string}
 */
Charmap.prototype.name_;

/**
 * @private
 * @type {CharmapType}
 */
Charmap.prototype.type_;

/**
 * @private
 * @type {string}
 */
Charmap.prototype.description_;

/**
 * @private
 * @type {string}
 */
Charmap.prototype.version_;

exports.CharmapType = CharmapType;
exports.Charmap = Charmap;
