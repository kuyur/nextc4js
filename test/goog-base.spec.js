var goog = require('../lib/goog-base');

describe('Google Closure basic functions unit test', function() {
  it('abstractMethod()', function() {
    expect(() => {goog.abstractMethod();}).toThrow('unimplemented abstract method');
  });

  it('nullFunction()', function() {
    expect(goog.nullFunction()).toBe(undefined);
  });

  it('typeOf()', function() {
    expect(goog.typeOf()).toBe('undefined');
    expect(goog.typeOf(null)).toBe('null');
    expect(goog.typeOf([])).toBe('array');
    expect(goog.typeOf({})).toBe('object');
    expect(goog.typeOf(0)).toBe('number');
    expect(goog.typeOf(true)).toBe('boolean');
    expect(goog.typeOf(goog.nullFunction)).toBe('function');
  });


  it('isNull()', function() {
    expect(goog.isNull(null)).toBe(true);
    expect(goog.isNull(undefined)).toBe(false);
  });

  it('isDefAndNotNull()', function() {
    expect(goog.isDefAndNotNull(null)).toBe(false);
    expect(goog.isDefAndNotNull(undefined)).toBe(false);

    expect(goog.isDefAndNotNull(0)).toBe(true);
    expect(goog.isDefAndNotNull([])).toBe(true);
    expect(goog.isDefAndNotNull('')).toBe(true);
  });

  it('isArrayLike()', function() {
    expect(goog.isArrayLike(null)).toBe(false);
    expect(goog.isArrayLike(undefined)).toBe(false);
    expect(goog.isArrayLike(0)).toBe(false);
    expect(goog.isArrayLike([])).toBe(true);
    expect(goog.isArrayLike('abc')).toBe(false);
    expect(goog.isArrayLike(new Uint8Array(1))).toBe(true);
  });

  it('isDateLike()', function() {
    expect(goog.isDateLike(null)).toBe(false);
    expect(goog.isDateLike(undefined)).toBe(false);
    expect(goog.isDateLike(0)).toBe(false);
    expect(goog.isDateLike([])).toBe(false);
    expect(goog.isDateLike('abc')).toBe(false);
    expect(goog.isDateLike(new Uint8Array(1))).toBe(false);
    expect(goog.isDateLike(new Date())).toBe(true);
  });

  it('isString()', function() {
    expect(goog.isString(null)).toBe(false);
    expect(goog.isString(undefined)).toBe(false);
    expect(goog.isString(0)).toBe(false);
    expect(goog.isString([])).toBe(false);
    expect(goog.isString('abc')).toBe(true);
    expect(goog.isString(new Uint8Array(1))).toBe(false);
    expect(goog.isString(new Date())).toBe(false);
  });

  it('isBoolean()', function() {
    expect(goog.isBoolean(null)).toBe(false);
    expect(goog.isBoolean(undefined)).toBe(false);
    expect(goog.isBoolean(0)).toBe(false);
    expect(goog.isBoolean([])).toBe(false);
    expect(goog.isBoolean('abc')).toBe(false);
    expect(goog.isBoolean(new Uint8Array(1))).toBe(false);
    expect(goog.isBoolean(new Date())).toBe(false);
    expect(goog.isBoolean(true)).toBe(true);
    expect(goog.isBoolean(false)).toBe(true);
  });

  it('isNumber()', function() {
    expect(goog.isNumber(null)).toBe(false);
    expect(goog.isNumber(undefined)).toBe(false);
    expect(goog.isNumber(0)).toBe(true);
    expect(goog.isNumber([])).toBe(false);
    expect(goog.isNumber('abc')).toBe(false);
    expect(goog.isNumber(new Uint8Array(1))).toBe(false);
    expect(goog.isNumber(new Date())).toBe(false);
    expect(goog.isNumber(true)).toBe(false);
    expect(goog.isNumber(false)).toBe(false);
  });

  it('isFunction()', function() {
    expect(goog.isFunction(null)).toBe(false);
    expect(goog.isFunction(undefined)).toBe(false);
    expect(goog.isFunction(0)).toBe(false);
    expect(goog.isFunction([])).toBe(false);
    expect(goog.isFunction('abc')).toBe(false);
    expect(goog.isFunction(new Uint8Array(1))).toBe(false);
    expect(goog.isFunction(new Date())).toBe(false);
    expect(goog.isFunction(true)).toBe(false);
    expect(goog.isFunction(false)).toBe(false);
    expect(goog.isFunction({})).toBe(false);
    expect(goog.isFunction(goog.nullFunction)).toBe(true);
  });

  it('isObject()', function() {
    expect(goog.isObject(null)).toBe(false);
    expect(goog.isObject(undefined)).toBe(false);
    expect(goog.isObject(0)).toBe(false);
    expect(goog.isObject([])).toBe(true);
    expect(goog.isObject('abc')).toBe(false);
    expect(goog.isObject(new Uint8Array(1))).toBe(true);
    expect(goog.isObject(new Date())).toBe(true);
    expect(goog.isObject(true)).toBe(false);
    expect(goog.isObject(false)).toBe(false);
    expect(goog.isObject({})).toBe(true);
    expect(goog.isObject(goog.nullFunction)).toBe(true);
  });
});
