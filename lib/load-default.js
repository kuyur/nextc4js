/**
 * @author kuyur@kuyur.info
 */

'use strict';

const defaultPreset = require('./contexts/context-default.json');
const { Context } = require('./context');

var defaultContext = null;

/**
 * Lazy load the default context.
 * @return {Context}
 */
exports.loadDefault = function() {
  if (!defaultContext) {
    return defaultContext = new Context(defaultPreset);
  }
  return defaultContext;
};
