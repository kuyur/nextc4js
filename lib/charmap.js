/**
 * @author kuyur@kuyur.net
 */

'use strict';

/**
 * @enum {string}
 */
const CharmapType = {
  DECODER: 'decoder',
  CONVERTER: 'converter',
  ENCODER: 'encoder'
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

/**
 * Get name of charmap.
 * @return {string}
 */
Charmap.prototype.getName = function() {
  return this.name_;
};

/**
 * Get type of charmap. Will be one of decoder, converter and encoder.
 * @return {CharmapType}
 */
Charmap.prototype.getType = function() {
  return this.type_;
};

exports.CharmapType = CharmapType;
exports.Charmap = Charmap;
