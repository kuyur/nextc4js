'use strict';

/**
 * Segment class.
 * @author kuyur@kuyur.info
 */

/**
 * DFA automaton to consume source string.
 * @constructor
 */
var ConditionDFA = function() {};

/**
 * Build a ConditionDFA instance.
 * @param {Array.<string>} condition
 * @return {?ConditionDFA}
 */
ConditionDFA.buildDFA = function(condition) {
  if (!condition || !condition.length) {
    return null;
  }

  condition.forEach(function (value, index) {
    // TODO
  });
};

ConditionDFA.prototype.match = function(chr) {

};

module.export = ConditionDFA;
