(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.nextc4 = factory());
})(this, (function () { 'use strict';

  var bufferUtils = {};

  /**
   * @author kuyur@kuyur.info
   */

  /**
   * Read bytes from buffer and return an integer.
   * @param {Uint8Array} buffer The byte order is big-endian.
   * @param {number} offset
   * @param {number} bytes Should not bigger than 4.
   * @return {number}
   */
  bufferUtils.readUInt32BE = function(buffer, offset, bytes) {
    bytes = Math.min(bytes, 4);
    if (offset + bytes > buffer.length) {
      throw 'Error: exceed the buffer boundary.';
    }
    var result = 0;
    for (var i = 0; i < bytes; ++i) {
      result |= buffer[offset + i] << (8 * (bytes - 1 - i));
    }
    return result >>> 0;
  };

  /**
   * Write a codepoint into buffer.
   * @param {Uint8Array} buffer The byte order is big-endian.
   * @param {number} offset
   * @param {number} chr codepoint.
   * @param {number} bytes Should not bigger than 4.
   */
  bufferUtils.writeUInt32BE = function(buffer, offset, chr, bytes) {
    bytes = Math.min(bytes, 4);
    if (offset + bytes > buffer.length) {
      throw 'Error: exceed the buffer boundary.';
    }
    for (var i = bytes - 1; i >= 0; i--) {
      buffer[offset + i] = chr & 0xFF;
      chr = chr >>> 8;
    }
  };

  /**
   * Convert the Unicode code points buffer to string.
   * @param {Uint32Array|Array.<number>} buffer
   * @return {?string}
   */
  bufferUtils.toString = function(buffer) {
    if (!buffer) {
      return null;
    }

    var chrs = [];
    for (var i = 0, len = buffer.length; i < len; ++i) {
      chrs[i] = String.fromCodePoint(buffer[i]);
    }

    return chrs.join('');
  };

  /**
   * Convert the string to Unicode code points buffer.
   * @param {string} str
   * @return {?Uint32Array}
   */
  bufferUtils.toBuffer = function(str) {
    if (!str) {
      return null;
    }

    var len = str.length;
    var buffer = new Uint32Array(len);
    var pos = 0;
    for (var i = 0; i < len; ++i) {
      var chr = str.codePointAt(i);
      buffer[pos++] = chr;
      if (chr > 65535) { // skip the next code unit
        i++;
      }
    }
    return buffer.slice(0, pos);
  };

  var utfUtils = {};

  var encodingRule = {};

  var googBase = {};

  /**
   * Basic function/utility copied from google closure library.
   * google closure library is published under Apache License 2.0.
   * @see https://github.com/google/closure-library
   */

  /**
   * When defining a class Foo with an abstract method bar(), you can do:
   * Foo.prototype.bar = goog.abstractMethod
   *
   * Now if a subclass of Foo fails to override bar(), an error will be thrown
   * when bar() is invoked.
   *
   * Note: This does not take the name of the function to override as an argument
   * because that would make it more difficult to obfuscate our JavaScript code.
   *
   * @type {!Function}
   * @throws {Error} when invoked to indicate the method should be overridden.
   */
  var abstractMethod = function() {
    throw Error('unimplemented abstract method');
  };

  /**
   * Null function used for default values of callbacks, etc.
   * @return {void} Nothing.
   */
  var nullFunction = function() {};

  /**
   * Inherit the prototype methods from one constructor into another.
   *
   * Usage:
   * <pre>
   * function ParentClass(a, b) { }
   * ParentClass.prototype.foo = function(a) { };
   *
   * function ChildClass(a, b, c) {
   *   ParentClass.call(this, a, b);
   * }
   * goog.inherits(ChildClass, ParentClass);
   *
   * var child = new ChildClass('a', 'b', 'see');
   * child.foo(); // This works.
   * </pre>
   *
   * @param {!Function} childCtor Child class.
   * @param {!Function} parentCtor Parent class.
   */
  var inherits = function(childCtor, parentCtor) {
    /** @constructor */
    function tempCtor() {}
    tempCtor.prototype = parentCtor.prototype;
    childCtor.super_ = parentCtor.prototype;
    childCtor.prototype = new tempCtor();
    /** @override */
    childCtor.prototype.constructor = childCtor;
  };

  /**
   * This is a "fixed" version of the typeof operator.  It differs from the typeof
   * operator in such a way that null returns 'null' and arrays return 'array'.
   * @param {*} value The value to get the type of.
   * @return {string} The name of the type.
   */
  var typeOf = function(value) {
    var s = typeof value;
    if (s === 'object') {
      if (value) {
        // Check these first, so we can avoid calling Object.prototype.toString if
        // possible.
        //
        // IE improperly marshals typeof across execution contexts, but a
        // cross-context object will still return false for "instanceof Object".
        if (value instanceof Array) {
          return 'array';
        } else if (value instanceof Object) {
          return s;
        }

        // HACK: In order to use an Object prototype method on the arbitrary
        //   value, the compiler requires the value be cast to type Object,
        //   even though the ECMA spec explicitly allows it.
        var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
        // In Firefox 3.6, attempting to access iframe window objects' length
        // property throws an NS_ERROR_FAILURE, so we need to special-case it
        // here.
        if (className === '[object Window]') {
          return 'object';
        }

        // We cannot always use constructor == Array or instanceof Array because
        // different frames have different Array objects. In IE6, if the iframe
        // where the array was created is destroyed, the array loses its
        // prototype. Then dereferencing val.splice here throws an exception, so
        // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
        // so that will work. In this case, this function will return false and
        // most array functions will still work because the array is still
        // array-like (supports length and []) even though it has lost its
        // prototype.
        // Mark Miller noticed that Object.prototype.toString
        // allows access to the unforgeable [[Class]] property.
        //  15.2.4.2 Object.prototype.toString ( )
        //  When the toString method is called, the following steps are taken:
        //      1. Get the [[Class]] property of this object.
        //      2. Compute a string value by concatenating the three strings
        //         "[object ", Result(1), and "]".
        //      3. Return Result(2).
        // and this behavior survives the destruction of the execution context.
        if ((className === '[object Array]' ||
             // In IE all non value types are wrapped as objects across window
             // boundaries (not iframe though) so we have to do object detection
             // for this edge case.
             typeof value.length == 'number' &&
             typeof value.splice != 'undefined' &&
             typeof value.propertyIsEnumerable != 'undefined' &&
             // eslint-disable-next-line no-prototype-builtins
             !value.propertyIsEnumerable('splice'))) {
          return 'array';
        }
        // HACK: There is still an array case that fails.
        //     function ArrayImpostor() {}
        //     ArrayImpostor.prototype = [];
        //     var impostor = new ArrayImpostor;
        // this can be fixed by getting rid of the fast path
        // (value instanceof Array) and solely relying on
        // (value && Object.prototype.toString.vall(value) === '[object Array]')
        // but that would require many more function calls and is not warranted
        // unless closure code is receiving objects from untrusted sources.

        // IE in cross-window calls does not correctly marshal the function type
        // (it appears just as an object) so we cannot use just typeof val ==
        // 'function'. However, if the object has a call property, it is a
        // function.
        if ((className === '[object Function]' ||
            typeof value.call != 'undefined' &&
            typeof value.propertyIsEnumerable != 'undefined' &&
            // eslint-disable-next-line no-prototype-builtins
            !value.propertyIsEnumerable('call'))) {
          return 'function';
        }

      } else {
        return 'null';
      }

    } else if (s === 'function' && typeof value.call == 'undefined') {
      // In Safari typeof nodeList returns 'function', and on Firefox typeof
      // behaves similarly for HTML{Applet,Embed,Object}, Elements and RegExps. We
      // would like to return object for those and we can detect an invalid
      // function by making sure that the function object has a call method.
      return 'object';
    }
    return s;
  };

  /**
   * Returns true if the specified value is null.
   * @param {?} val Variable to test.
   * @return {boolean} Whether variable is null.
   */
  var isNull = function(val) {
    return val === null;
  };

  /**
   * Returns true if the specified value is defined and not null.
   * @param {?} val Variable to test.
   * @return {boolean} Whether variable is defined and not null.
   */
  var isDefAndNotNull = function(val) {
    // Note that undefined == null.
    return val != null;
  };

  /**
   * Returns true if the specified value is an array.
   * @param {?} val Variable to test.
   * @return {boolean} Whether variable is an array.
   */
  var isArray = function(val) {
    return typeOf(val) === 'array';
  };

  /**
   * Returns true if the object looks like an array. To qualify as array like
   * the value needs to be either a NodeList or an object with a Number length
   * property.
   * @param {?} val Variable to test.
   * @return {boolean} Whether variable is an array.
   */
  var isArrayLike = function(val) {
    var type = typeOf(val);
    return type === 'array' || type === 'object' && typeof val.length === 'number';
  };

  /**
   * Returns true if the object looks like a Date. To qualify as Date-like the
   * value needs to be an object and have a getFullYear() function.
   * @param {?} val Variable to test.
   * @return {boolean} Whether variable is a like a Date.
   */
  var isDateLike = function(val) {
    return isObject(val) && typeof val.getFullYear == 'function';
  };

  /**
   * Returns true if the specified value is a string.
   * @param {?} val Variable to test.
   * @return {boolean} Whether variable is a string.
   */
  var isString = function(val) {
    return typeof val == 'string';
  };

  /**
   * Returns true if the specified value is a boolean.
   * @param {?} val Variable to test.
   * @return {boolean} Whether variable is boolean.
   */
  var isBoolean = function(val) {
    return typeof val == 'boolean';
  };

  /**
   * Returns true if the specified value is a number.
   * @param {?} val Variable to test.
   * @return {boolean} Whether variable is a number.
   */
  var isNumber = function(val) {
    return typeof val == 'number';
  };

  /**
   * Returns true if the specified value is a function.
   * @param {?} val Variable to test.
   * @return {boolean} Whether variable is a function.
   */
  var isFunction = function(val) {
    return typeOf(val) === 'function';
  };

  /**
   * Returns true if the specified value is an object. This includes arrays and
   * functions.
   * @param {?} val Variable to test.
   * @return {boolean} Whether variable is an object.
   */
  var isObject = function(val) {
    var type = typeof val;
    return type === 'object' && val != null || type === 'function';
    // return Object(val) === val also works, but is slower, especially if val is
    // not an object.
  };

  googBase.abstractMethod = abstractMethod;
  googBase.nullFunction = nullFunction;
  googBase.inherits = inherits;
  googBase.typeOf = typeOf;
  googBase.isNull = isNull;
  googBase.isDefAndNotNull = isDefAndNotNull;
  googBase.isArray = isArray;
  googBase.isArrayLike = isArrayLike;
  googBase.isDateLike = isDateLike;
  googBase.isString = isString;
  googBase.isBoolean = isBoolean;
  googBase.isNumber = isNumber;
  googBase.isFunction = isFunction;
  googBase.isObject = isObject;

  var segment$3 = {};

  var condition = {};

  /**
   * @author kuyur@kuyur.info
   */

  /**
   * Condition class.
   * @constructor
   * @param {Array.<{from:number, to:number}>} ranges
   */
  var Condition$4 = function(ranges) {
    this.bytes_ = ranges.length;
    this.ranges_ = ranges;
  };

  /**
   * @private
   * @type {number}
   */
  Condition$4.prototype.bytes_;

  /**
   * @private
   * @type {Array.<{from:number, to:number}>}
   */
  Condition$4.prototype.ranges_;

  /**
   * @return {number}
   */
  Condition$4.prototype.getBytes = function() {
    return this.bytes_;
  };

  /**
   * Test the character match the condition or not.
   * @param {number} chr code point.
   * @return {boolean}
   */
  Condition$4.prototype.match = function(chr) {
    if (!this.bytes_) {
      return false;
    }

    var current;
    for (var i = this.bytes_ - 1; i >= 0 ; --i) {
      current = chr & 0xFF;
      if (current < this.ranges_[i].from || current > this.ranges_[i].to) {
        return false;
      }
      chr = chr >> 8;
    }
    return true;
  };

  /**
   * @return {number}
   */
  Condition$4.prototype.getBlockSize = function() {
    if (!this.bytes_) {
      return 0;
    }
    var last = this.ranges_[this.bytes_ - 1];
    return last.to - last.from + 1;
  };

  /**
   * @return {number}
   */
  Condition$4.prototype.getBlockCount = function() {
    if (!this.bytes_) {
      return 0;
    }
    var count = 1;
    for (var i = 0; i < this.bytes_ - 1; ++i) {
      count = count * (this.ranges_[i].to - this.ranges_[i].from + 1);
    }
    return count;
  };

  /**
   * @param {number} chr
   * @return {number}
   */
  Condition$4.prototype.getIndexingOffset = function(chr) {
    if (!this.bytes_) {
      return -1;
    }

    var carries = this.getCarries_();
    var current;
    var offset = 0;
    for (var i = this.bytes_ - 1; i >= 0 ; --i) {
      current = chr & 0xFF;
      if (current < this.ranges_[i].from || current > this.ranges_[i].to) {
        return -1;
      }
      offset += (current - this.ranges_[i].from) * carries[i];
      chr = chr >> 8;
    }
    return offset;
  };

  /**
   * @param {number} offset 0-based.
   * @return {number}
   */
  Condition$4.prototype.getCodePoint = function(offset) {
    if (!this.bytes_) {
      return -1;
    }

    var carries = this.getCarries_();
    var byte,
      codepoint = 0;
    for (var i = 0; i < this.bytes_; ++i) {
      if (offset >= carries[i]) {
        byte = Math.floor(offset / carries[i]) + this.ranges_[i].from;
        codepoint |= byte << (8 * (this.bytes_ - 1 - i));
        offset = offset % carries[i];
      } else {
        byte = this.ranges_[i].from;
        codepoint |= byte << (8 * (this.bytes_ - 1 - i));
      }
    }
    return codepoint >>> 0;
  };

  /**
   * @private
   * @return {Array.<number>}
   */
  Condition$4.prototype.getCarries_ = function() {
    if (!this.carries_) {
      this.carries_ = [];
      this.carries_[this.bytes_ - 1] = 1;
      for (var i = this.bytes_ - 2; i >= 0 ; --i) {
        this.carries_[i] = this.carries_[i + 1] *
          (this.ranges_[i + 1].to - this.ranges_[i + 1].from + 1);
      }
    }
    return this.carries_;
  };

  /**
   * Test the condition can consume the bytes inside the buffer or not.
   * @param {Uint8Array} buffer the byte order is big-endian (MBCS buffer).
   * @param {number} offset The position (pointer) to read byte inside buffer.
   * @return {boolean}
   */
  Condition$4.prototype.consume = function(buffer, offset) {
    if (!this.bytes_) {
      return false;
    }
    if (offset + this.bytes_ > buffer.length) {
      return false;
    }
    for (var i = 0; i < this.bytes_; ++i) {
      if (buffer[offset + i] < this.ranges_[i].from ||
        buffer[offset + i] > this.ranges_[i].to) {
        return false;
      }
    }
    return true;
  };

  /**
   * Build a Condition instance.
   * @param {Array.<string>} condition
   * @return {?Condition}
   */
  Condition$4.build = function(condition) {
    if (!condition || !condition.length) {
      return null;
    }

    var result = [];
    condition.forEach(function(c) {
      var parts = c.split('~');
      if (parts.length === 1) {
        var n = +parts[0];
        if (!isNaN(n)) {
          result.push({
            from: n,
            to: n
          });
        }
      } else if (parts.length === 2) {
        var from = +parts[0], to = +parts[1];
        if (!isNaN(from) && !isNaN(to) && from >= 0 && from <= 0xFF && to >= 0 && to <= 0xFF) {
          result.push({
            from: Math.min(from, to),
            to: Math.max(from, to)
          });
        }
      }
    });

    return result.length ? new Condition$4(result) : null;
  };

  condition.Condition = Condition$4;

  /**
   * Segment class.
   * @author kuyur@kuyur.info
   */

  const { Condition: Condition$3 } = condition;

  /**
   * @enum {string}
   */
  const Reference$1 = {
    ASCII: 'ascii',
    UNDEFINED: 'undefined',
    BUFFER: 'buffer',
    INDEXING_BUFFER: 'indexing-buffer',
    SELF: 'self',
    GB18030_UNICODE_SP_MAPPING: 'gb18030-unicode-sp-mapping'
  };

  /**
   * @constructor
   * @param {{
   *   begin: number,
   *   end: number,
   *   condition: string[],
   *   reference: Reference,
   *   offset: number,
   *   characterset: string
   * }} options
   */
  var Segment = function(options) {
    this.begin_ = options.begin;
    this.end_ = options.end;
    this.condition_ = Condition$3.build(options.condition);
    this.reference_ = options.reference;
    this.offset_ = options.offset;
    this.characterset_ = options.characterset;
  };

  /**
   * @private
   * @type {number}
   */
  Segment.prototype.begin_;

  /**
   * @private
   * @type {number}
   */
  Segment.prototype.end_;

  /**
   * @private
   * @type {?Condition}
   */
  Segment.prototype.condition_;

  /**
   * @private
   * @type {Reference}
   */
  Segment.prototype.reference_;

  /**
   * @private
   * @type {number}
   */
  Segment.prototype.offset_;

  /**
   * @private
   * @type {string}
   */
  Segment.prototype.characterset_;

  /**
   * @return {number}
   */
  Segment.prototype.getBegin = function() {
    return this.begin_;
  };

  /**
   * @return {number}
   */
  Segment.prototype.getEnd = function() {
    return this.end_;
  };

  /**
   * @return {number}
   */
  Segment.prototype.getOffset = function() {
    return this.offset_;
  };

  /**
   * @return {Reference}
   */
  Segment.prototype.getReference = function() {
    return this.reference_;
  };

  /**
   * @return {?Condition}
   */
  Segment.prototype.getCondition = function() {
    return this.condition_;
  };

  /**
   * @constructor
   * @param {Array.<Object|Segment>} options
   */
  var Segments = function(options) {
    this.segments_ = [];
    if (options) {
      options.forEach(function(segment) {
        if (!(segment instanceof Segment)) {
          segment = new Segment(segment);
        }
        this.segments_.push(segment);
      }, this);
    }
  };

  /**
   * @private
   * @type {Array.<Segment>}
   */
  Segments.prototype.segments_;

  /**
   * find the matched Segment.
   * @param {number} chr code point.
   * @return {?Segment}
   */
  Segments.prototype.find = function(chr) {
    for (var i = 0, len = this.segments_.length; i < len; ++i) {
      if (chr >= this.segments_[i].begin_ && chr <= this.segments_[i].end_) {
        if (!this.segments_[i].condition_ || this.segments_[i].condition_.match(chr)) {
          return this.segments_[i];
        }
      }
    }

    return null;
  };

  segment$3.Reference = Reference$1;
  segment$3.Segment = Segment;
  segment$3.Segments = Segments;

  var gb18030 = {};

  var consts$6 = {};

  /**
   * @author kuyur@kuyur.info
   */

  consts$6.UNICODE_UNKNOWN_CHAR = 0xFFFD;
  consts$6.UNICODE_BYTE_ORDER_MARK = 0xFEFF; // U+FEFF byte order mark (BOM)
  consts$6.UTF8_BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
  consts$6.UTF16LE_BOM = new Uint8Array([0xFF, 0xFE]);
  consts$6.UTF16BE_BOM = new Uint8Array([0xFE, 0xFF]);
  consts$6.MBCS_UNKNOWN_CHAR = 0x3F; // ?
  consts$6.MBCS_WHITE_SPACE = {
    GBK: 0xA1A1, // GBK full-width whitespace
    GB18030: 0xA1A1
  };
  consts$6.EMBEDDED_BASE64_PREFIX = 'data:application/octet-stream;base64,';

  /**
   * @author kuyur@kuyur.info
   */

  const { Condition: Condition$2 } = condition;
  const consts$5 = consts$6;

  var GB18030_UNICODE_SP = Condition$2.build(['0x90~0xE3', '0x30~0x39', '0x81~0xFE', '0x30~0x39']);

  /**
   * Convert GB18030 code point (0x90~0xE3 0x30~0x39 0x81~0xFE 0x30~0x39) to
   * Unicode code point (Supplementary Plain).
   * @see https://archive.org/details/GB18030-2005
   * @param {number} chr GB18030 code point.
   * @return {number} Unicode code point.
   */
  var convertGB18030ToUnicodeSP = function(chr) {
    if (chr < 0x90308130 || chr > 0xE3329A35)  {
      return consts$5.UNICODE_UNKNOWN_CHAR;
    }
    var offset = GB18030_UNICODE_SP.getIndexingOffset(chr);
    if (offset === -1 || offset > 0xFFFFF) {
      return consts$5.UNICODE_UNKNOWN_CHAR;
    }
    return offset + 0x10000;
  };

  /**
   * Convert Unicode code point (Supplementary Plain) to GB18030 code point.
   * @param {number} chr Unicode code point.
   * @return {number}
   */
  var convertUnicodeSPToGB18030 = function(chr) {
    if (chr < 0x10000 || chr > 0x10FFFF) {
      return consts$5.MBCS_WHITE_SPACE.GB18030;
    }
    var offset = chr - 0x10000;
    return GB18030_UNICODE_SP.getCodePoint(offset);
  };

  gb18030.convertGB18030ToUnicodeSP = convertGB18030ToUnicodeSP;
  gb18030.convertUnicodeSPToGB18030 = convertUnicodeSPToGB18030;

  /**
   * Reading rule class.
   * @author kuyur@kuyur.info
   */

  const goog$7 = googBase;
  const segment$2 = segment$3;
  const gb18030utils$1 = gb18030;
  const bufferutils = bufferUtils;

  /**
   * The basic class of encoding-rule.
   * @constructor
   */
  var EncodingRule = function() {};

  /**
   * Encode the Unicode code points.
   * @param {Uint32Array|Array.<number>} buffer Every element must be a Unicode
   *   code points.
   * @return {Uint8Array}
   */
  EncodingRule.prototype.encode = function(buffer) {
    var length = this.test(buffer);
    if (length === -1){
      return null;
    }

    var result = new Uint8Array(length);
    var offset = 0;
    for (var i = 0, len = buffer.length; i < len; ++i) {
      offset += this.consume(buffer, i, result, offset);
    }

    return result;
  };

  /**
   * Encode the JavaScript string.
   * @param {string} str
   * @param {?boolean} opt_returnArray if true, will return array instead of Uint8Array. Default is false.
   * @return {Uint8Array|Array}
   */
  EncodingRule.prototype.unparse = function(str, opt_returnArray) {
    var length = this.tell(str);
    if (length === -1){
      return null;
    }

    var result = opt_returnArray ? [] : new Uint8Array(length);
    var offset = 0;
    for (var i = 0, len = str.length; i < len; ++i) {
      var chr = str.codePointAt(i);
      offset += this.write(chr, result, offset);
      if (chr > 65535) { // skip the next code unit
        i++;
      }
    }

    return result;
  };

  /**
   * Test the buffer and return length of encoded bytes.
   * @param {Uint32Array|Array.<number>} buffer
   * @return {number} The length of encoded bytes.
   */
  EncodingRule.prototype.test = goog$7.abstractMethod;

  /**
   * Consume a Unicode code point from source buffer and save the encoded binary
   * into result buffer. Won't check the bytes strictly.
   * @protected
   * @param {Uint32Array|Array.<number>} buffer The source buffer holding UTF-16
   *   code points.
   * @param {number} pos The position (pointer) to read next Unicode code point.
   * @param {Uint8Array} result
   * @param {number} offset The position (pointer) to write the encoded binary
   *   into result array.
   * @return {number} bytes encoded.
   */
  EncodingRule.prototype.consume = goog$7.abstractMethod;

  /**
   * Return length of encoded bytes.
   * @param {string} str
   * @return {number} The length of encoded bytes.
   */
  EncodingRule.prototype.tell = goog$7.abstractMethod;

  /**
   * Encode the char and write into result buffer.
   * @param {number} chr Code point of the char.
   * @param {Uint8Array|Array} result
   *   into result array.
   * @param {number} offset The position (pointer) to write the encoded binary
   *   into result array.
   * @return {number} The length of encoded bytes.
   */
  EncodingRule.prototype.write = goog$7.abstractMethod;

  /**
   * UTF-16 little-endian encoding rule.
   * @constructor
   * @extends {EncodingRule}
   */
  var EncodingRuleUTF16LE = function() {
    EncodingRule.call(this);
  };
  goog$7.inherits(EncodingRuleUTF16LE, EncodingRule);

  /**
   * The invalid Unicode code point will be skipped.
   * @override
   * @param {Uint32Array|Array.<number>} buffer
   * @return {number} The length of encoded bytes.
   */
  EncodingRuleUTF16LE.prototype.test = function(buffer) {
    if (!goog$7.isArrayLike(buffer)) {
      return -1;
    }
    if (buffer.length === 0) {
      return 0;
    }

    var result = 0, chr;
    for (var i = 0, len = buffer.length; i < len; ++i) {
      chr = buffer[i] >>> 0;
      if (chr <= 0xD7FF) {
        result += 2;
      } else if (chr >= 0xD800 && chr <= 0xDFFF) ; else if (chr >= 0xE000 && chr <= 0xFFFF) {
        result += 2;
      } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
        result += 4;
      } else ;
    }
    return result;
  };

  /**
   * The invalid Unicode code point will be skipped.
   * @override
   * @param {Uint32Array|Array.<number>} buffer
   * @param {number} pos
   * @param {Uint8Array} result
   * @param {number} offset
   * @return {number}
   */
  EncodingRuleUTF16LE.prototype.consume = function(buffer, pos, result, offset) {
    var bytes;
    var chr = buffer[pos] >>> 0;
    if (chr <= 0xD7FF || (chr >= 0xE000 && chr <= 0xFFFF)) {
      result[offset] = chr & 0xFF;
      result[offset + 1] = chr >> 8;
      bytes = 2;
    } else if (chr >= 0xD800 && chr <= 0xDFFF) {
      // not a valid Unicode code point
      bytes = 0;
    } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
      chr -= 0x10000;
      var low = (chr & 0x3FF) + 0xDC00;
      var high = (chr >> 10) + 0xD800;
      result[offset] = high & 0xFF;
      result[offset + 1] = high >> 8;
      result[offset + 2] = low & 0xFF;
      result[offset + 3] = low >> 8;
      bytes = 4;
    } else {
      // not a valid Unicode code point
      bytes = 0;
    }

    return bytes;
  };

  /**
   * @override
   * @param {string} str
   * @return {number}
   */
  EncodingRuleUTF16LE.prototype.tell = function(str) {
    return goog$7.isString(str) ? str.length * 2 : -1;
  };

  /**
   * @override
   * @param {number} chr
   * @param {Uint8Array|Array} result
   * @param {number} offset
   * @return {number}
   */
  EncodingRuleUTF16LE.prototype.write = function(chr, result, offset) {
    var bytes;
    if (chr <= 0xD7FF || (chr >= 0xE000 && chr <= 0xFFFF)) {
      result[offset] = chr & 0xFF;
      result[offset + 1] = chr >> 8;
      bytes = 2;
    } else if (chr >= 0xD800 && chr <= 0xDFFF) {
      // not a valid Unicode code point
      bytes = 0;
    } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
      chr -= 0x10000;
      var low = (chr & 0x3FF) + 0xDC00;
      var high = (chr >> 10) + 0xD800;
      result[offset] = high & 0xFF;
      result[offset + 1] = high >> 8;
      result[offset + 2] = low & 0xFF;
      result[offset + 3] = low >> 8;
      bytes = 4;
    } else {
      // not a valid Unicode code point
      bytes = 0;
    }

    return bytes;
  };

  /**
   * UTF-16 big-endian encoding rule.
   * @constructor
   * @extends {EncodingRule}
   */
  var EncodingRuleUTF16BE = function() {
    EncodingRule.call(this);
  };
  goog$7.inherits(EncodingRuleUTF16BE, EncodingRule);

  /**
   * The invalid Unicode code point will be ignored.
   * @override
   * @param {Uint32Array|Array.<number>} buffer
   * @return {number} The length of encoded bytes.
   */
  EncodingRuleUTF16BE.prototype.test = function(buffer) {
    if (!goog$7.isArrayLike(buffer)) {
      return -1;
    }
    if (buffer.length === 0) {
      return 0;
    }

    var result = 0, chr;
    for (var i = 0, len = buffer.length; i < len; ++i) {
      chr = buffer[i] >>> 0;
      if (chr <= 0xD7FF) {
        result += 2;
      } else if (chr >= 0xD800 && chr <= 0xDFFF) ; else if (chr >= 0xE000 && chr <= 0xFFFF) {
        result += 2;
      } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
        result += 4;
      } else ;
    }
    return result;
  };

  /**
   * The invalid Unicode code point will be skipped.
   * @override
   * @param {Uint32Array|Array.<number>} buffer
   * @param {number} pos
   * @param {Uint8Array} result
   * @param {number} offset
   * @return {number}
   */
  EncodingRuleUTF16BE.prototype.consume = function(buffer, pos, result, offset) {
    var bytes;
    var chr = buffer[pos] >>> 0;
    if (chr <= 0xD7FF || (chr >= 0xE000 && chr <= 0xFFFF)) {
      result[offset] = chr >> 8;
      result[offset + 1] = chr & 0xFF;
      bytes = 2;
    } else if (chr >= 0xD800 && chr <= 0xDFFF) {
      // not a valid Unicode code point
      bytes = 0;
    } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
      chr -= 0x10000;
      var low = (chr & 0x3FF) + 0xDC00;
      var high = (chr >> 10) + 0xD800;
      result[offset] = high >> 8;
      result[offset + 1] = high & 0xFF;
      result[offset + 2] = low >> 8;
      result[offset + 3] = low & 0xFF;
      bytes = 4;
    } else {
      // not a valid Unicode code point
      bytes = 0;
    }

    return bytes;
  };

  /**
   * @override
   * @param {string} str
   * @return {number}
   */
  EncodingRuleUTF16BE.prototype.tell = function(str) {
    return goog$7.isString(str) ? str.length * 2 : -1;
  };

  /**
   * @override
   * @param {number} chr
   * @param {Uint8Array|Array} result
   * @param {number} offset
   * @return {number}
   */
  EncodingRuleUTF16BE.prototype.write = function(chr, result, offset) {
    var bytes;
    if (chr <= 0xD7FF || (chr >= 0xE000 && chr <= 0xFFFF)) {
      result[offset] = chr >> 8;
      result[offset + 1] = chr & 0xFF;
      bytes = 2;
    } else if (chr >= 0xD800 && chr <= 0xDFFF) {
      // not a valid Unicode code point
      bytes = 0;
    } else if (chr >= 0x10000 && chr <= 0x10FFFF) {
      chr -= 0x10000;
      var low = (chr & 0x3FF) + 0xDC00;
      var high = (chr >> 10) + 0xD800;
      result[offset] = high >> 8;
      result[offset + 1] = high & 0xFF;
      result[offset + 2] = low >> 8;
      result[offset + 3] = low & 0xFF;
      bytes = 4;
    } else {
      // not a valid Unicode code point
      bytes = 0;
    }

    return bytes;
  };

  /**
   * UTF-8 encoding rule.
   * @constructor
   * @extends {EncodingRule}
   */
  var EncodingRuleUTF8 = function() {
    EncodingRule.call(this);
  };
  goog$7.inherits(EncodingRuleUTF8, EncodingRule);

  /**
   * The invalid Unicode code point will be ignored.
   * @override
   * @param {Uint32Array|Array.<number>} buffer
   * @return {number} The length of bytes with UTF-8 encoding.
   */
  EncodingRuleUTF8.prototype.test = function(buffer) {
    if (!goog$7.isArrayLike(buffer)) {
      return -1;
    }
    if (buffer.length === 0) {
      return 0;
    }

    var result = 0, chr;
    for (var i = 0, len = buffer.length; i < len; ++i) {
      chr = buffer[i] >>> 0;
      if (chr <= 0x7F) { // U+0000 ~ U+007F
        result += 1;
      } else if (chr <= 0x7FF) { // U+0080 ~ U+07FF
        result += 2;
      } else if (chr <= 0xD7FF) { // U+0800 ~ U+D7FF
        result += 3;
      } else if (chr <= 0xDFFF) ; else if (chr <= 0xFFFF) { // U+E000 ~ U+FFFF
        result += 3;
      } else if (chr <= 0x10FFFF) { // U+10000 ~- U+10FFFF
        result += 4;
      } else ;
    }
    return result;
  };

  /**
   * The invalid Unicode code point will be skipped.
   * @override
   * @param {Uint32Array|Array.<number>} buffer
   * @param {number} pos
   * @param {Uint8Array} result
   * @param {number} offset
   * @return {number}
   */
  EncodingRuleUTF8.prototype.consume = function(buffer, pos, result, offset) {
    var bytes;
    var chr = buffer[pos] >>> 0;
    if (chr <= 0x7F) { // U+0000 ~ U+007F
      result[offset] = chr;
      bytes = 1;
    } else if (chr <= 0x7FF) { // U+0080 ~ U+07FF
      result[offset] = 0xC0 | (chr >> 6);
      result[offset + 1] = 0x80 | (chr & 0x3F);
      bytes = 2;
    } else if (chr >= 0xD800 && chr <= 0xDFFF) { // U+D800 ~ U+DFFF
      // not a valid Unicode code point
      bytes = 0;
    } else if (chr <= 0xFFFF) { // U+0800 ~ U+D7FF, U+E000 ~ U+FFFF
      result[offset] = 0xE0 | (chr >> 12);
      result[offset + 1] = 0x80 | ((chr >> 6) & 0x3F);
      result[offset + 2] = 0x80 | (chr & 0x3F);
      bytes = 3;
    } else if (chr <= 0x10FFFF) { // U+10000 ~- U+10FFFF
      result[offset] = 0xF0 | (chr >> 18);
      result[offset + 1] = 0x80 | ((chr >> 12) & 0x3F);
      result[offset + 2] = 0x80 | ((chr >> 6) & 0x3F);
      result[offset + 3] = 0x80 | (chr & 0x3F);
      bytes = 4;
    } else {
      // not a valid Unicode code point
      bytes = 0;
    }

    return bytes;
  };

  /**
   * @override
   * @param {string} str
   * @return {number}
   */
  EncodingRuleUTF8.prototype.tell = function(str) {
    if (!goog$7.isString(str)) {
      return -1;
    }

    var result = 0, chr;
    for (var i = 0, len = str.length; i < len; ++i) {
      chr = str.codePointAt(i);
      if (chr <= 0x7F) { // U+0000 ~ U+007F
        result += 1;
      } else if (chr <= 0x7FF) { // U+0080 ~ U+07FF
        result += 2;
      } else if (chr <= 0xD7FF) { // U+0800 ~ U+D7FF
        result += 3;
      } else if (chr <= 0xDFFF) ; else if (chr <= 0xFFFF) { // U+E000 ~ U+FFFF
        result += 3;
      } else if (chr <= 0x10FFFF) { // U+10000 ~- U+10FFFF
        result += 4;
      } else ;
      if (chr > 65535) {
        i++;
      }
    }
    return result;
  };

  /**
   * @override
   * @param {number} chr
   * @param {Uint8Array|Array} result
   * @param {number} offset
   * @return {number}
   */
  EncodingRuleUTF8.prototype.write = function(chr, result, offset) {
    var bytes;
    if (chr <= 0x7F) { // U+0000 ~ U+007F
      result[offset] = chr;
      bytes = 1;
    } else if (chr <= 0x7FF) { // U+0080 ~ U+07FF
      result[offset] = 0xC0 | (chr >> 6);
      result[offset + 1] = 0x80 | (chr & 0x3F);
      bytes = 2;
    } else if (chr >= 0xD800 && chr <= 0xDFFF) { // U+D800 ~ U+DFFF
      // not a valid Unicode code point
      bytes = 0;
    } else if (chr <= 0xFFFF) { // U+0800 ~ U+D7FF, U+E000 ~ U+FFFF
      result[offset] = 0xE0 | (chr >> 12);
      result[offset + 1] = 0x80 | ((chr >> 6) & 0x3F);
      result[offset + 2] = 0x80 | (chr & 0x3F);
      bytes = 3;
    } else if (chr <= 0x10FFFF) { // U+10000 ~- U+10FFFF
      result[offset] = 0xF0 | (chr >> 18);
      result[offset + 1] = 0x80 | ((chr >> 12) & 0x3F);
      result[offset + 2] = 0x80 | ((chr >> 6) & 0x3F);
      result[offset + 3] = 0x80 | (chr & 0x3F);
      bytes = 4;
    } else {
      // not a valid Unicode code point
      bytes = 0;
    }

    return bytes;
  };

  /**
   * The encoding rule for common Variable-width encoding (MBCS, Multiple-byte Character Set).
   * @constructor
   * @param {Array.<Object>} segments
   * @param {Uint16Array|Uint32Array|string} mappingBuffer
   * @param {number} unknownChar
   * @extends {EncodingRule}
   */
  var EncodingRuleMultibyte = function(segments, mappingBuffer, unknownChar) {
    EncodingRule.call(this);

    this.segments_ = new segment$2.Segments(segments);
    this.mappingBuffer_ = mappingBuffer;
    this.unknownChar_ = unknownChar || 0x3F;
    this.unknownCharBytes_ = this.getCharBytes_(this.unknownChar_);
  };
  goog$7.inherits(EncodingRuleMultibyte, EncodingRule);

  /**
   * @private
   * @type {segment.Segments}
   */
  EncodingRuleMultibyte.prototype.segments_;

  /**
   * The mapping buffer to encoding Unicode code point (BMP) into MBCS code point.
   * The mapping buffer is storing MBCS code point in Unicode order.
   * @private
   * @type {Uint16Array|Uint32Array}
   */
  EncodingRuleMultibyte.prototype.mappingBuffer_;

  /**
   * @private
   * @type {number}
   */
  EncodingRuleMultibyte.prototype.unknownChar_;

  /**
   * Get bytes of one code point inside mapping buffer.
   * @return {number}
   */
  EncodingRuleMultibyte.prototype.getBytesOfCodepoint = function() {
    if (!this.mappingBuffer_) {
      return 0;
    }

    if (this.mappingBuffer_ instanceof Uint16Array) {
      return 2;
    }

    if (this.mappingBuffer_ instanceof Uint32Array) {
      return 4;
    }

    return 0;
  };

  /**
   * The invalid Unicode code point will be ignored.
   * @override
   * @param {Uint32Array|Array.<number>} buffer
   * @return {number} The length of bytes with MBCS encoding.
   */
  EncodingRuleMultibyte.prototype.test = function(buffer) {
    if (!goog$7.isArrayLike(buffer)) {
      return -1;
    }
    var len = buffer.length;
    if (len === 0) {
      return 0;
    }

    var result = 0, chr, seg;
    for (var i = 0; i < len; ++i) {
      chr = buffer[i] >>> 0;
      seg = this.segments_.find(chr);
      if (!seg) {
        result += this.unknownCharBytes_;
        continue;
      }
      switch (seg.getReference()) {
        case segment$2.Reference.ASCII:
          result += 1;
          break;
        case segment$2.Reference.BUFFER:
          if (!this.mappingBuffer_) {
            result += this.unknownCharBytes_;
          } else {
            result += this.getCharBytes_(this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()]);
          }
          break;
        case segment$2.Reference.GB18030_UNICODE_SP_MAPPING:
          result += 4;
          break;
      }
    }
    return result;
  };

  /**
   * @param {number} chr
   * @return {number}
   */
  EncodingRuleMultibyte.prototype.getCharBytes_ = function(chr) {
    chr = chr >>> 0;
    return chr <= 0xFF ? 1 : chr <= 0xFFFF ? 2 : 4;
  };

  /**
   * @override
   * @param {Uint32Array|Array.<number>} buffer
   * @param {number} pos
   * @param {Uint8Array} result
   * @param {number} offset
   * @return {number}
   */
  EncodingRuleMultibyte.prototype.consume = function(buffer, pos, result, offset) {
    var bytes = 0;
    var chr = buffer[pos] >>> 0, converted;
    var seg = this.segments_.find(chr);
    if (!seg) {
      bufferutils.writeUInt32BE(result, offset, this.unknownChar_, this.unknownCharBytes_);
      return this.unknownCharBytes_;
    }
    switch (seg.getReference()) {
      case segment$2.Reference.ASCII:
        result[offset] = chr;
        bytes = 1;
        break;
      case segment$2.Reference.BUFFER:
        if (!this.mappingBuffer_) {
          bufferutils.writeUInt32BE(result, offset, this.unknownChar_, this.unknownCharBytes_);
          return this.unknownCharBytes_;
        }
        converted = this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()];
        bytes = this.getCharBytes_(converted);
        bufferutils.writeUInt32BE(result, offset, converted, bytes);
        break;
      case segment$2.Reference.GB18030_UNICODE_SP_MAPPING:
        converted = gb18030utils$1.convertUnicodeSPToGB18030(chr);
        bytes = 4;
        bufferutils.writeUInt32BE(result, offset, converted, bytes);
        break;
    }
    return bytes;
  };

  /**
   * @override
   * @param {string} str
   * @return {number}
   */
  EncodingRuleMultibyte.prototype.tell = function(str) {
    if (!goog$7.isString(str)) {
      return -1;
    }

    var result = 0, chr, seg;
    for (var i = 0, len = str.length; i < len; ++i) {
      chr = str.codePointAt(i);
      if (chr > 65535) {
        i++;
      }
      seg = this.segments_.find(chr);
      if (!seg) {
        result += this.unknownCharBytes_;
        continue;
      }
      switch (seg.getReference()) {
        case segment$2.Reference.ASCII:
          result += 1;
          break;
        case segment$2.Reference.BUFFER:
          if (!this.mappingBuffer_) {
            result += this.unknownCharBytes_;
          } else {
            result += this.getCharBytes_(this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()]);
          }
          break;
        case segment$2.Reference.GB18030_UNICODE_SP_MAPPING:
          result += 4;
          break;
      }
    }
    return result;
  };

  /**
   * @override
   * @param {number} chr
   * @param {Uint8Array} result
   * @param {number} offset
   * @return {number}
   */
  EncodingRuleMultibyte.prototype.write = function(chr, result, offset) {
    var bytes = 0;
    var converted;
    var seg = this.segments_.find(chr);
    if (!seg) {
      bufferutils.writeUInt32BE(result, offset, this.unknownChar_, this.unknownCharBytes_);
      return this.unknownCharBytes_;
    }
    switch (seg.getReference()) {
      case segment$2.Reference.ASCII:
        result[offset] = chr;
        bytes = 1;
        break;
      case segment$2.Reference.BUFFER:
        if (!this.mappingBuffer_) {
          bufferutils.writeUInt32BE(result, offset, this.unknownChar_, this.unknownCharBytes_);
          return this.unknownCharBytes_;
        }
        converted = this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()];
        bytes = this.getCharBytes_(converted);
        bufferutils.writeUInt32BE(result, offset, converted, bytes);
        break;
      case segment$2.Reference.GB18030_UNICODE_SP_MAPPING:
        converted = gb18030utils$1.convertUnicodeSPToGB18030(chr);
        bytes = 4;
        bufferutils.writeUInt32BE(result, offset, converted, bytes);
        break;
    }
    return bytes;
  };

  encodingRule.UTF16LE = new EncodingRuleUTF16LE();
  encodingRule.UTF16BE = new EncodingRuleUTF16BE();
  encodingRule.UTF8 = new EncodingRuleUTF8();
  encodingRule.Multibyte = EncodingRuleMultibyte;

  /**
   * @author kuyur@kuyur.info
   */

  const {UTF8, UTF16LE, UTF16BE} = encodingRule;

  /**
   * Pad zero if the length of input string is less than 2.
   * @param {string} str
   * @return {string}
   */
  var padZero = function(str) {
    if (str.length === 0) {
      return '00';
    }
    if (str.length === 1) {
      return '0' + str;
    }
    return str;
  };

  /**
   * Convert the string to Unicode code points.
   * @param {string} str
   * @return {?Array.<number>}
   */
  utfUtils.toCodePoints = function(str) {
    if (!str) {
      return null;
    }

    var len = str.length;
    var results = [];
    var pos = 0;
    for (var i = 0; i < len; ++i) {
      var chr = str.codePointAt(i);
      results[pos++] = chr;
      if (chr > 65535) { // skip the next code unit
        i++;
      }
    }
    return results.slice(0, pos);
  };

  /**
   * Convert the string to UTF8 binary.
   * @param {string} str
   * @return {?Array.<number>}
   */
  utfUtils.toUTF8Binary = function(str) {
    return UTF8.unparse(str, true);
  };

  /**
   * Convert the string to UTF8 hex format.
   * @param {string} str
   * @return {?Array.<string>}
   */
  utfUtils.toUTF8Hex = function(str) {
    var binaryArr = UTF8.unparse(str, true);
    if (!binaryArr) {
      return null;
    }

    return binaryArr.map(code => padZero(code.toString(16).toUpperCase()));
  };

  /**
   * Convert the string to UTF16LE binary.
   * @param {string} str
   * @return {?Array.<number>}
   */
  utfUtils.toUTF16LEBinary = function(str) {
    return UTF16LE.unparse(str, true);
  };

  /**
   * Convert the string to UTF16LE hex format.
   * @param {string} str
   * @return {?Array.<string>}
   */
  utfUtils.toUTF16LEHex = function(str) {
    var binaryArr = UTF16LE.unparse(str, true);
    if (!binaryArr) {
      return null;
    }

    return binaryArr.map(code => padZero(code.toString(16).toUpperCase()));
  };

  /**
   * Convert the string to UTF16BE binary.
   * @param {string} str
   * @return {?Array.<number>}
   */
  utfUtils.toUTF16BEBinary = function(str) {
    return UTF16BE.unparse(str, true);
  };

  /**
   * Convert the string to UTF16BE hex format.
   * @param {string} str
   * @return {?Array.<string>}
   */
  utfUtils.toUTF16BEHex = function(str) {
    var binaryArr = UTF16BE.unparse(str, true);
    if (!binaryArr) {
      return null;
    }

    return binaryArr.map(code => padZero(code.toString(16).toUpperCase()));
  };

  var channel = {};

  /**
   * @author kuyur@kuyur.info
   */

  const goog$6 = googBase;

  /**
   * Channel class. A channel must have a decoder and an encoder at least.
   * Converters are optional.
   * @constructor
   * @param {Decoder} decoder
   * @param {Encoder} encoder
   * @param {(Array.<Converter>|Converter)=} opt_converters
   */
  var Channel$2 = function(decoder, encoder, opt_converters) {
    this.decoder_ = decoder;
    this.encoder_ = encoder;
    if (opt_converters) {
      this.converters_ = goog$6.isArray(opt_converters) ? opt_converters.slice() : [opt_converters];
    }
  };

  /**
   * @private
   * @type {Decoder}
   */
  Channel$2.prototype.decoder_;

  /**
   * @private
   * @type {Encoder}
   */
  Channel$2.prototype.encoder_;

  /**
   * @private
   * @type {Array.<Converter>}
   */
  Channel$2.prototype.converters_;

  /**
   * Can the source buffer be decoded in the channel.
   * @param {Uint8Array} buffer
   */
  Channel$2.prototype.match = function(buffer) {
    return this.decoder_.match(buffer);
  };

  /**
   * Process (decoding, converting and then encoding) the source buffer and
   * output processed result.
   * @param {Uint8Array} buffer
   * @return {?Uint8Array}
   */
  Channel$2.prototype.process = function(buffer) {
    var buf = this.decoder_.decode(buffer);
    if (!buf) {
      return null;
    }

    if (this.converters_) {
      this.converters_.forEach(function(converter) {
        buf = converter.convert(buf);
      }, this);
    }

    return this.encoder_.encode(buf);
  };

  channel.Channel = Channel$2;

  var charmap = {};

  /**
   * @author kuyur@kuyur.info
   */

  /**
   * @enum {string}
   */
  const CharmapType$4 = {
    DECODER: 'decoder',
    CONVERTER: 'converter',
    ENCODER: 'encoder'
  };

  /**
   * @constructor
   * @param {string} name
   * @param {CharmapType} type
   */
  var Charmap$3 = function(name, type) {
    this.name_ = name;
    this.type_ = type;
  };

  /**
   * @private
   * @type {string}
   */
  Charmap$3.prototype.name_;

  /**
   * @private
   * @type {CharmapType}
   */
  Charmap$3.prototype.type_;

  /**
   * @private
   * @type {string}
   */
  Charmap$3.prototype.description_;

  /**
   * @private
   * @type {string}
   */
  Charmap$3.prototype.version_;

  /**
   * Get name of charmap.
   * @return {string}
   */
  Charmap$3.prototype.getName = function() {
    return this.name_;
  };

  /**
   * Get type of charmap. Will be one of decoder, converter and encoder.
   * @return {CharmapType}
   */
  Charmap$3.prototype.getType = function() {
    return this.type_;
  };

  charmap.CharmapType = CharmapType$4;
  charmap.Charmap = Charmap$3;

  var converter = {};

  var base64$4 = {};

  /**
   * The base64 encoding/decoding implementation for browser environment.
   * The encode method accepts an Uint8Array as input.
   * The decode method outputs an Uint8Array as result.
   * @author kuyur@kuyur.info
   * @see https://en.wikipedia.org/wiki/Base64
   */

  /**
   * the index table of base64 (000000 ~ 111111) to accelerate the converting.
   * @type {string}
   */
  const mapping = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  /**
   * the padding character.
   * @type {string}
   */
  const padding = '=';

  /**
   * Encode a binary array into base64.
   * @param {Uint8Array} buffer Binary buffer.
   * @return {string} The encoded base64 string.
   */
  base64$4.encode = function(buffer) {
    if (!buffer) {
      return '';
    }
    var length = buffer.length;
    if (!length) {
      return '';
    }

    var result = [],
      tail = length % 3,
      end = length - tail,
      uint24 = 0,
      offset = 0;
    for (var i = 0; i < end; i += 3) {
      uint24 = (buffer[i] << 16) | (buffer[i+1] << 8) | buffer[i+2];
      result[offset++] = mapping[(uint24 >>> 18) & 0x3F];
      result[offset++] = mapping[(uint24 >>> 12) & 0x3F];
      result[offset++] = mapping[(uint24 >>> 6) & 0x3F];
      result[offset++] = mapping[uint24 & 0x3F];
    }
    if (tail === 1) {
      result[offset++] = mapping[(buffer[end] >>> 2) & 0x3F];
      result[offset++] = mapping[(buffer[end] << 4) & 0x30];
      result[offset++] = padding;
      result[offset] = padding;
    } else if (tail === 2) {
      result[offset++] = mapping[(buffer[end] >>> 2) & 0x3F];
      result[offset++] = mapping[((buffer[end] << 4) & 0x30) | ((buffer[end + 1] >>> 4) & 0xF)];
      result[offset++] = mapping[(buffer[end + 1] << 2) &0x3C];
      result[offset] = padding;
    }

    return result.join('');
  };

  /**
   * The reversed mapping.
   * @type {Object.<string, number>}
   */
  const decoding_mapping = (function() {
    var result = {};
    for (var i = 0; i < 64; ++i) {
      result[mapping[i]] = i;
    }
    return result;
  })();

  /**
   * Decode a base64 encoded string and return binary array. Supporting the string
   * which is not padded with "=".
   * @param {string} string The encoded base64 string.
   * @return {Uint8Array} The decoded binary buffer.
   */
  base64$4.decode = function(string) {
    if (!string) {
      return new Uint8Array(0);
    }
    var length = string.length;
    if (!length) {
      return new Uint8Array(0);
    }

    if (string.endsWith('==')) {
      string = string.substring(0, length - 2);
      length -= 2;
    } else if (string.endsWith('=')) {
      string = string.substring(0, length - 1);
      length -= 1;
    }

    var tail = length % 4;
    var total = Math.floor(length / 4) * 3;
    if (tail !== 0) {
      if (tail === 1) {
        throw 'Invalid base64 string.';
      }
      // check last 6 bits
      var bit6_last = decoding_mapping[string[length - 1]];
      if (bit6_last === undefined) {
        throw 'Invalid base64 string.';
      }
      if (tail === 2 && ((bit6_last & 0xF) !== 0)) {
        throw 'Invalid base64 string.';
      }
      if (tail === 3 && ((bit6_last & 0x3) !== 0)) {
        throw 'Invalid base64 string.';
      }
      total += tail === 2 ? 1 : 2;
    }

    var buffer = new Uint8Array(total),
      end = length - tail,
      uint24 = 0,
      bit6_1,
      bit6_2,
      bit6_3,
      bit6_4,
      offset = 0;
    for (var i = 0; i < end; i += 4) {
      bit6_1 = decoding_mapping[string[i]];
      bit6_2 = decoding_mapping[string[i + 1]];
      bit6_3 = decoding_mapping[string[i + 2]];
      bit6_4 = decoding_mapping[string[i + 3]];
      if (bit6_1 === undefined || bit6_2 === undefined || bit6_3 === undefined || bit6_4 === undefined) {
        throw 'Invalid base64 string.';
      }

      uint24 = (bit6_1 << 18) | (bit6_2 << 12) | (bit6_3 << 6) | bit6_4;
      buffer[offset++] = (uint24 >>> 16) & 0xFF;
      buffer[offset++] = (uint24 >>> 8) & 0xFF;
      buffer[offset++] = uint24 & 0xFF;
    }
    if (tail === 2) {
      bit6_1 = decoding_mapping[string[end]];
      bit6_2 = decoding_mapping[string[end + 1]];
      if (bit6_1 === undefined) {
        throw 'Invalid base64 string.';
      }
      buffer[offset] = (bit6_1 << 2) | (bit6_2 >>> 4);
    } else if (tail === 3) {
      bit6_1 = decoding_mapping[string[end]];
      bit6_2 = decoding_mapping[string[end + 1]];
      bit6_3 = decoding_mapping[string[end + 2]];
      if (bit6_1 === undefined || bit6_2 === undefined) {
        throw 'Invalid base64 string.';
      }
      buffer[offset++] = (bit6_1 << 2) | (bit6_2 >>> 4);
      buffer[offset] = ((bit6_2 & 0xF) << 4) | (bit6_3 >>> 2);
    }

    return buffer;
  };

  /**
   * @author kuyur@kuyur.info
   */

  const { Charmap: Charmap$2, CharmapType: CharmapType$3} = charmap;
  const consts$4 = consts$6;
  const goog$5 = googBase;
  const segment$1 = segment$3;
  const base64$3 = base64$4;

  /**
   * The Converter class. Converter is basing on Unicode.
   * @param {{
   *   name: string,
   *   description: string,
   *   version: string,
   *   buffer: Uint16Array|Uint32Array|string,
   *   byte: ?number,
   *   segments: Array.<Object>
   * }} options
   * @constructor
   * @extends {Charmap}
   */
  var Converter$2 = function(options) {
    if (!options || !options.name) {
      throw 'options should provide name property at least';
    }
    Charmap$2.call(this, options.name, CharmapType$3.CONVERTER);

    this.description_ = options.description;
    this.version_ = options.version;
    this.segments_ = new segment$1.Segments(options.segments);

    this.mappingBuffer_ = null;
    if (options.buffer) {
      if ((options.buffer instanceof Uint16Array) || (options.buffer instanceof Uint32Array)) {
        this.mappingBuffer_ = options.buffer;
      } else if (goog$5.isString(options.buffer)) {
        if (options.buffer.startsWith(consts$4.EMBEDDED_BASE64_PREFIX)) {
          var encoded = options.buffer.substring(consts$4.EMBEDDED_BASE64_PREFIX.length);
          var charmap = base64$3.decode(encoded.trim());
          this.mappingBuffer_ = options.byte === 2 ? new Uint16Array(charmap.buffer) : new Uint32Array(charmap.buffer);
        }
      }
    }
  };
  goog$5.inherits(Converter$2, Charmap$2);

  /**
   * @private
   * @type {string}
   */
  Converter$2.prototype.description_;

  /**
   * @private
   * @type {string}
   */
  Converter$2.prototype.version_;

  /**
   * @private
   * @type {segment.Segments}
   */
  Converter$2.prototype.segments_;

  /**
   * @private
   * @type {Unit32Array|Uint16Array}
   */
  Converter$2.prototype.mappingBuffer_;

  /**
   * Get bytes of one code point inside buffer.
   * @return {number}
   */
  Converter$2.prototype.getBytesOfCodepoint = function() {
    if (!this.mappingBuffer_) {
      return 0;
    }

    if (this.mappingBuffer_ instanceof Uint16Array) {
      return 2;
    }

    if (this.mappingBuffer_ instanceof Uint32Array) {
      return 4;
    }

    return 0;
  };

  /**
   * Convert Unicode code points.
   * @override
   * @param {Uint32Array} buffer
   * @return {?Uint32Array}
   */
  Converter$2.prototype.convert = function(buffer) {
    if (!buffer) {
      return null;
    }

    var result = new Uint32Array(buffer.length);
    for (var i = 0, len = buffer.length; i < len; ++i) {
      result[i] = this.convertChar_(buffer[i]);
    }

    return result;
  };

  /**
   * Convert a Unicode code point.
   * @private
   * @param {number} chr
   * @return {number}
   */
  Converter$2.prototype.convertChar_ = function(chr) {
    chr = chr >>> 0;
    var seg = this.segments_.find(chr);
    if (!seg) {
      return consts$4.UNICODE_UNKNOWN_CHAR;
    }

    switch (seg.getReference()) {
      case segment$1.Reference.SELF:
        return chr;
      case segment$1.Reference.BUFFER:
        if (!this.mappingBuffer_) {
          return consts$4.UNICODE_UNKNOWN_CHAR;
        }
        return this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()];
      default:
        return consts$4.UNICODE_UNKNOWN_CHAR;
    }
  };

  converter.Converter = Converter$2;

  var decoder$2 = {};

  var decodingRule = {};

  /**
   * Reading rule class.
   * @author kuyur@kuyur.info
   */

  const { Condition: Condition$1 } = condition;
  const goog$4 = googBase;
  const consts$3 = consts$6;
  const segment = segment$3;
  const gb18030utils = gb18030;

  /**
   * The basic class of decoding-rule.
   * @constructor
   */
  var DecodingRule = function() {};

  /**
   * Decode a content buffer and return code points in a Uint32Array. Each code
   * point will cost 4 bytes.
   * @param {Uint8Array} buffer content to decode.
   * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
   * @return {?Uint32Array} will return null if the content is not matched with
   *   the decoding rule.
   */
  DecodingRule.prototype.decode = function(buffer, opt_offset) {
    var length = this.test(buffer, opt_offset);
    if (length === -1) {
      // not matched
      return null;
    }

    var result = new Uint32Array(length);
    var offset = goog$4.isNumber(opt_offset) ? opt_offset : 0;
    var bytes;
    for (var pos = 0, len = buffer.length; offset < len; ++pos) {
      bytes = this.consume(buffer, offset, result, pos);
      if (bytes === 0) {
        return null;
      }
      offset += bytes;
    }

    return result;
  };

  /**
   * Decode a content buffer and return native JavaScript string.
   * @param {Uint8Array} buffer content to parse.
   * @param {?number} opt_offset the start position in buffer to parse. 0 by default.
   * @return {string>} will return an empty string if the content is not matched
   *   with the decoding rule.
   */
  DecodingRule.prototype.parse = function(buffer, opt_offset) {
    var result = [],
      pos = 0;
    var offset = goog$4.isNumber(opt_offset) ? opt_offset : 0;
    var mapped;
    for (var len = buffer.length; offset < len;) {
      mapped = this.read(buffer, offset);
      if (!mapped) {
        return '';
      }
      result[pos++] = mapped.decoded;
      offset += mapped.consumed;
    }

    return result.join('');
  };

  /**
   * Test the content buffer satisfy the DecodingRule or not.
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the position in buffer to start test. 0 by default.
   * @return {boolean}
   */
  DecodingRule.prototype.match = function(buffer, opt_offset) {
    return this.test(buffer, opt_offset) !== -1;
  };

  /**
   * Test the content buffer satisfy the DecodingRule and return the length. Will
   * return -1 if buffer content is not satisfied the decoding rule.
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the position in buffer to start test. 0 by default.
   * @return {number} The count of code points.
   */
  DecodingRule.prototype.test = goog$4.abstractMethod;

  /**
   * Consume(parse) a code point from the buffer and save into result array.
   * Won't check the bytes strictly.
   * @protected
   * @param {Uint8Array} buffer
   * @param {number} offset The position (pointer) to read next code point in
   *   buffer.
   * @param {Uint32Array} result
   * @param {number} pos The position (pointer) to write the code point into
   *   result array.
   * @return {number} bytes consumed.
   */
  DecodingRule.prototype.consume = goog$4.abstractMethod;

  /**
   * Read a code point from the buffer and return the decoded result.
   * Will check the bytes strictly. If the bytes are not matched with the decoding
   * rule, should return null.
   * @protected
   * @param {Uint8Array} buffer
   * @param {number} offset The position (pointer) to read next code point from the buffer.
   * @return {?{
   *   consumed: number,
   *   decoded: string
   * }}
   */
  DecodingRule.prototype.read = goog$4.abstractMethod;

  /**
   * UTF-16 little-endian decoding rule.
   * @constructor
   * @extends {DecodingRule}
   */
  var DecodingRuleUTF16LE = function() {
    DecodingRule.call(this);
  };
  goog$4.inherits(DecodingRuleUTF16LE, DecodingRule);

  /**
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the position in buffer to start test. 0 by default.
   * @return {number} The count of code points.
   */
  DecodingRuleUTF16LE.prototype.test = function(buffer, opt_offset) {
    var offset = goog$4.isNumber(opt_offset) ? opt_offset : 0;
    if (!buffer) {
      return -1;
    }
    if (buffer.length === 0) {
      return 0;
    }
    var remain = buffer.length - offset;
    if (remain <= 0) {
      return 0;
    }
    if (remain & 0x1 !== 0) { // must be an even number
      return -1;
    }

    var result = 0;
    var chr, low, consumed;
    for (var i = offset, len = buffer.length; i < len;) {
      chr = buffer[i] | (buffer[i + 1] << 8);
      consumed = 0;
      if (chr <= 0xD7FF || chr >= 0xE000) {
        result += 1;
        consumed = 2;
      } else {
        if (chr >= 0xD800 && chr <= 0xDBFF && i + 3 < len) { // high byte matched
          low = buffer[i + 2] | (buffer[i + 3] << 8);
          if (low >= 0xDC00 && low <= 0xDFFF) { // low byte matched
            result += 1;
            consumed = 4;
          }
        }
      }
      if (!consumed) {
        return -1;
      }
      i += consumed;
    }

    return result;
  };

  /**
   * The parsed result is a Unicode code point.
   * @override
   * @param {Uint8Array} buffer
   * @param {number} offset
   * @param {Uint32Array} result
   * @param {number} pos
   * @return {number}
   */
  DecodingRuleUTF16LE.prototype.consume = function(buffer, offset, result, pos) {
    var chr = buffer[offset] | (buffer[offset + 1] << 8), consumed = 2;
    if (chr >= 0xD800 && chr <= 0xDBFF) { // high byte matched
      var low = buffer[offset + 2] | (buffer[offset + 3] << 8);
      chr = (((chr & 0x3FF) << 10) | (low & 0x3FF)) + 0x10000;
      consumed = 4;
    }
    result[pos] = chr;
    return consumed;
  };

  /**
   * Read a code point from the buffer and return the decoded result.
   * @override
   * @param {Uint8Array} buffer
   * @param {number} offset
   * @return {?{
   *   consumed: number,
   *   decoded: string
   * }}
   */
  DecodingRuleUTF16LE.prototype.read = function(buffer, offset) {
    var length = buffer.length;
    if (offset + 1 >= length) { // invalid
      return null;
    }
    var high = buffer[offset] | (buffer[offset + 1] << 8),
      low,
      consumed = 2;
    if (high >= 0xD800 && high <= 0xDBFF) { // high byte matched
      if (offset + 3 >= length) { // invalid
        return null;
      }
      low = buffer[offset + 2] | (buffer[offset + 3] << 8);
      if (low < 0xDC00 || low > 0xDFFF) { // invalid
        return null;
      }
      consumed = 4;
    }
    // another method to get the character from code point:
    //   var chr = (((high & 0x3FF) << 10) | (low & 0x3FF)) + 0x10000;
    //   String.fromCodePoint(chr);
    return {
      consumed: consumed,
      decoded: consumed === 2 ? String.fromCharCode(high) : String.fromCharCode(high) + String.fromCharCode(low)
    };
  };

  /**
   * UTF-16 big-endian decoding rule.
   * @constructor
   * @extends {DecodingRule}
   */
  var DecodingRuleUTF16BE = function() {
    DecodingRule.call(this);
  };
  goog$4.inherits(DecodingRuleUTF16BE, DecodingRule);

  /**
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the position in buffer to start test. 0 by default.
   * @return {number} The count of code points.
   */
  DecodingRuleUTF16BE.prototype.test = function(buffer, opt_offset) {
    var offset = goog$4.isNumber(opt_offset) ? opt_offset : 0;
    if (!buffer) {
      return -1;
    }
    if (buffer.length === 0) {
      return 0;
    }
    var remain = buffer.length - offset;
    if (remain <= 0) {
      return 0;
    }
    if (remain & 0x1 !== 0) { // must be an even number
      return -1;
    }

    var result = 0;
    var chr, low, consumed;
    for (var i = offset, len = buffer.length; i < len;) {
      chr = (buffer[i] << 8) | buffer[i + 1];
      consumed = 0;
      if (chr <= 0xD7FF || chr >= 0xE000) {
        result += 1;
        consumed = 2;
      } else {
        if (chr >= 0xD800 && chr <= 0xDBFF && i + 3 < len) { // high byte matched
          low = (buffer[i + 2] << 8) | buffer[i + 3];
          if (low >= 0xDC00 && low <= 0xDFFF) { // low byte matched
            result += 1;
            consumed = 4;
          }
        }
      }
      if (!consumed) {
        return -1;
      }
      i += consumed;
    }

    return result;
  };

  /**
   * @override
   * @param {Uint8Array} buffer
   * @param {number} offset
   * @param {Uint32Array} result
   * @param {number} pos
   * @return {number}
   */
  DecodingRuleUTF16BE.prototype.consume = function(buffer, offset, result, pos) {
    var chr = (buffer[offset] << 8) | buffer[offset + 1], consumed = 2;
    if (chr >= 0xD800 && chr <= 0xDBFF) { // high byte matched
      var low = (buffer[offset + 2] << 8) | buffer[offset + 3];
      chr = (((chr & 0x3FF) << 10) | (low & 0x3FF)) + 0x10000;
      consumed = 4;
    }
    result[pos] = chr;
    return consumed;
  };

  /**
   * Read a code point from the buffer and return the decoded result.
   * @override
   * @param {Uint8Array} buffer
   * @param {number} offset
   * @return {?{
   *   consumed: number,
   *   decoded: string
   * }}
   */
  DecodingRuleUTF16BE.prototype.read = function(buffer, offset) {
    var length = buffer.length;
    if (offset + 1 >= length) { // invalid
      return null;
    }
    var high = (buffer[offset] << 8) | buffer[offset + 1],
      low,
      consumed = 2;
    if (high >= 0xD800 && high <= 0xDBFF) { // high byte matched
      if (offset + 3 >= length) { // invalid
        return null;
      }
      low = (buffer[offset + 2] << 8) | buffer[offset + 3];
      if (low < 0xDC00 || low > 0xDFFF) { // invalid
        return null;
      }
      consumed = 4;
    }
    // another method to get the character from code point:
    //   var chr = (((high & 0x3FF) << 10) | (low & 0x3FF)) + 0x10000;
    //   String.fromCodePoint(chr);
    return {
      consumed: consumed,
      decoded: consumed === 2 ? String.fromCharCode(high) : String.fromCharCode(high) + String.fromCharCode(low)
    };
  };

  /**
   * UTF-8 decoding rule. The maximum representable code point for UTF-8 is
   * 0x7FFFFFFF. It is the largest number of 4-bytes signed integer, and it is
   * much larger than the maximum code point of Unicode (0x10FFFF).
   * @see https://en.wikipedia.org/wiki/UTF-8
   * @constructor
   * @extends {DecodingRule}
   */
  var DecodingRuleUTF8 = function() {
    DecodingRule.call(this);
  };
  goog$4.inherits(DecodingRuleUTF8, DecodingRule);

  /**
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the position in buffer to start test. 0 by default.
   * @return {number} The count of code points.
   */
  DecodingRuleUTF8.prototype.test = function(buffer, opt_offset) {
    var offset = goog$4.isNumber(opt_offset) ? opt_offset : 0;
    if (!buffer) {
      return -1;
    }
    if (buffer.length === 0 || buffer.length - offset <= 0) {
      return 0;
    }

    var result = 0;
    for (var i = offset, length = buffer.length; i < length;) {
      if ((0x80 & buffer[i]) === 0) { // ASCII
        i++;
        result++;
      } else if (i + 1 < length &&
        (0xE0 & buffer[i]) === 0xC0 &&
        (0xC0 & buffer[i + 1]) === 0x80) { // 110xxxxx 10xxxxxx
        i += 2;
        result++;
      } else if (i + 2 < length &&
        (0xF0 & buffer[i]) === 0xE0 &&
        (0xC0 & buffer[i + 1]) === 0x80 &&
        (0xC0 & buffer[i + 2]) === 0x80) { // 1110xxxx 10xxxxxx 10xxxxxx
        i +=3;
        result++;
      } else if (i + 3 < length &&
        (0xF8 & buffer[i]) === 0xF0 &&
        (0xC0 & buffer[i + 1]) === 0x80 &&
        (0xC0 & buffer[i + 2]) === 0x80 &&
        (0xC0 & buffer[i + 3]) === 0x80) { // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
        i += 4;
        result++;
      } else if (i + 4 < length &&
        (0xFC & buffer[i]) === 0xF8 &&
        (0xC0 & buffer[i + 1]) === 0x80 &&
        (0xC0 & buffer[i + 2]) === 0x80 &&
        (0xC0 & buffer[i + 3]) === 0x80 &&
        (0xC0 & buffer[i + 4]) === 0x80) { // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
        i += 5;
        result++;
      } else if (i + 5 < length &&
        (0xFE & buffer[i]) === 0xFC &&
        (0xC0 & buffer[i + 1]) === 0x80 &&
        (0xC0 & buffer[i + 2]) === 0x80 &&
        (0xC0 & buffer[i + 3]) === 0x80 &&
        (0xC0 & buffer[i + 4]) === 0x80 &&
        (0xC0 & buffer[i + 5]) === 0x80) { // 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
        i += 6;
        result++;
      } else {
        return -1; // not matched
      }
    }

    return result;
  };

  /**
   * Only check leading byte to accelerate the decoding. The parsed result
   * will be a Unicode code point.
   * @override
   * @param {Uint8Array} buffer
   * @param {number} offset
   * @param {Uint32Array} result
   * @param {number} pos
   * @return {number}
   */
  DecodingRuleUTF8.prototype.consume = function(buffer, offset, result, pos) {
    if ((0x80 & buffer[offset]) === 0) { // ASCII
      result[pos] = buffer[offset];
      return 1;
    } else if ((0xE0 & buffer[offset]) === 0xC0) { // 110xxxxx 10xxxxxx
      result[pos] = (buffer[offset] & 0x3F) << 6 | (buffer[offset + 1] & 0x3F);
      return 2;
    } else if ((0xF0 & buffer[offset]) === 0xE0) { // 1110xxxx 10xxxxxx 10xxxxxx
      result[pos] = (buffer[offset] & 0x1F) << 12 |
        (buffer[offset + 1] & 0x3F) << 6 |
        (buffer[offset + 2] & 0x3F);
      return 3;
    } else if ((0xF8 & buffer[offset]) === 0xF0) { // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
      result[pos] = (buffer[offset] & 0x0F) << 18 |
        (buffer[offset + 1] & 0x3F) << 12 |
        (buffer[offset + 2] & 0x3F) << 6 |
        (buffer[offset + 3] & 0x3F);
      return 4;
    } else if ((0xFC & buffer[offset]) === 0xF8) { // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
      result[pos] = (buffer[offset] & 0x07) << 24 |
        (buffer[offset + 1] & 0x3F) << 18 |
        (buffer[offset + 2] & 0x3F) << 12 |
        (buffer[offset + 3] & 0x3F) << 6 |
        (buffer[offset + 4] & 0x3F);
      return 5;
    } else if ((0xFE & buffer[offset]) === 0xFC) { // 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
      result[pos] = (buffer[offset] & 0x03) << 30 |
        (buffer[offset + 1] & 0x3F) << 24 |
        (buffer[offset + 2] & 0x3F) << 18 |
        (buffer[offset + 3] & 0x3F) << 12 |
        (buffer[offset + 4] & 0x3F) << 6 |
        (buffer[offset + 5] & 0x3F);
      return 6;
    }

    return 0;
  };

  /**
   * Read a code point from the buffer and return the decoded result.
   * @override
   * @param {Uint8Array} buffer
   * @param {number} offset
   * @return {?{
   *   consumed: number,
   *   decoded: string
   * }}
   */
  DecodingRuleUTF8.prototype.read = function(buffer, offset) {
    var length = buffer.length,
      codepoint;
    if ((0x80 & buffer[offset]) === 0) { // ASCII
      codepoint = buffer[offset];
      return {
        consumed: 1,
        decoded: String.fromCharCode(codepoint)
      };
    } else if (offset + 1 < length &&
      (0xE0 & buffer[offset]) === 0xC0 &&
      (0xC0 & buffer[offset + 1]) === 0x80) { // 110xxxxx 10xxxxxx
      codepoint = (buffer[offset] & 0x3F) << 6 | (buffer[offset + 1] & 0x3F);
      return {
        consumed: 2,
        decoded: String.fromCharCode(codepoint)
      };
    } else if (offset + 2 < length &&
      (0xF0 & buffer[offset]) === 0xE0 &&
      (0xC0 & buffer[offset + 1]) === 0x80 &&
      (0xC0 & buffer[offset + 2]) === 0x80) { // 1110xxxx 10xxxxxx 10xxxxxx
      codepoint = (buffer[offset] & 0x1F) << 12 |
        (buffer[offset + 1] & 0x3F) << 6 |
        (buffer[offset + 2] & 0x3F);
      return {
        consumed: 3,
        decoded: String.fromCharCode(codepoint)
      };
    } else if (offset + 3 < length &&
      (0xF8 & buffer[offset]) === 0xF0 &&
      (0xC0 & buffer[offset + 1]) === 0x80 &&
      (0xC0 & buffer[offset + 2]) === 0x80 &&
      (0xC0 & buffer[offset + 3]) === 0x80) { // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
      codepoint = (buffer[offset] & 0x0F) << 18 |
        (buffer[offset + 1] & 0x3F) << 12 |
        (buffer[offset + 2] & 0x3F) << 6 |
        (buffer[offset + 3] & 0x3F);
      return {
        consumed: 4,
        decoded: String.fromCodePoint(codepoint)
      };
    } else if (offset + 4 < length &&
      (0xFC & buffer[offset]) === 0xF8 &&
      (0xC0 & buffer[offset + 1]) === 0x80 &&
      (0xC0 & buffer[offset + 2]) === 0x80 &&
      (0xC0 & buffer[offset + 3]) === 0x80 &&
      (0xC0 & buffer[offset + 4]) === 0x80) { // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
      codepoint = (buffer[offset] & 0x07) << 24 |
        (buffer[offset + 1] & 0x3F) << 18 |
        (buffer[offset + 2] & 0x3F) << 12 |
        (buffer[offset + 3] & 0x3F) << 6 |
        (buffer[offset + 4] & 0x3F);
      return {
        consumed: 5,
        decoded: String.fromCodePoint(codepoint)
      };
    } else if (offset + 5 < length &&
      (0xFE & buffer[offset]) === 0xFC &&
      (0xC0 & buffer[offset + 1]) === 0x80 &&
      (0xC0 & buffer[offset + 2]) === 0x80 &&
      (0xC0 & buffer[offset + 3]) === 0x80 &&
      (0xC0 & buffer[offset + 4]) === 0x80 &&
      (0xC0 & buffer[offset + 5]) === 0x80) { // 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
      codepoint = (buffer[offset] & 0x03) << 30 |
        (buffer[offset + 1] & 0x3F) << 24 |
        (buffer[offset + 2] & 0x3F) << 18 |
        (buffer[offset + 3] & 0x3F) << 12 |
        (buffer[offset + 4] & 0x3F) << 6 |
        (buffer[offset + 5] & 0x3F);
      return {
        consumed: 6,
        decoded: String.fromCodePoint(codepoint)
      };
    }

    return null;
  };

  /**
   * The decoding rule for common Variable-width encoding (MBCS, Multi-byte Character Set).
   * @see https://en.wikipedia.org/wiki/Variable-width_encoding
   * @param {Array.<{condition: string[]}>} rules
   * @param {Array.<{
   *   begin: number,
   *   end: number,
   *   reference: string,
   *   condition: ?string[],
   *   offset: ?number,
   *   characterset: ?string
   * }>} segments
   * @param {Uint16Array|Uint32Array} mappingBuffer
   * @constructor
   * @extends {DecodingRule}
   */
  var DecodingRuleMultibyte = function(rules, segments, mappingBuffer) {
    DecodingRule.call(this);

    this.conditions_ = [];
    if (rules && goog$4.isArray(rules)) {
      rules.forEach(function(rule) {
        var con = Condition$1.build(rule.condition);
        if (con) {
          this.conditions_.push(con);
        }
      }, this);
    }

    this.segments_ = new segment.Segments(segments);
    this.mappingBuffer_ = mappingBuffer;
  };
  goog$4.inherits(DecodingRuleMultibyte, DecodingRule);

  /**
   * @private
   * @type {Array.<Condition>}
   */
  DecodingRuleMultibyte.prototype.conditions_;

  /**
   * The mapping buffer to convert MBCS code point to Unicode code point.
   * The mapping buffer is storing Unicode code points in MBCS order.
   * @private
   * @type {Uint16Array|Uint32Array}
   */
  DecodingRuleMultibyte.prototype.mappingBuffer_;

  /**
   * @private
   * @type {segment.Segments}
  */
  DecodingRuleMultibyte.prototype.segments_;

  /**
   * Get bytes of one code point inside mapping buffer.
   * @return {number}
   */
  DecodingRuleMultibyte.prototype.getBytesOfCodepoint = function() {
    if (!this.mappingBuffer_) {
      return 0;
    }

    if (this.mappingBuffer_ instanceof Uint16Array) {
      return 2;
    }

    if (this.mappingBuffer_ instanceof Uint32Array) {
      return 4;
    }

    return 0;
  };

  /**
   * Only check the code point sequence matched with conditions or not.
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the position in buffer to start test. 0 by default.
   * @return {number} The count of code points.
   */
  DecodingRuleMultibyte.prototype.test = function(buffer, opt_offset) {
    var offset = goog$4.isNumber(opt_offset) ? opt_offset : 0;
    if (!this.conditions_.length || !buffer) {
      return -1;
    }
    if (buffer.length === 0 || buffer.length - offset <= 0) {
      return 0;
    }

    var result = 0;
    var condition;
    for (var i = offset, length = buffer.length; i < length;) {
      condition = this.find_(buffer, i);
      if (!condition) {
        return -1;
      }
      i += condition.getBytes();
      result++;
    }

    return result;
  };

  /**
   * Check the code point sequence strictly. If any code point is mapped to unknown
   * char (0xFFFD), will return false.
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the position in buffer to start test. 0 by default.
   * @return {boolean}
   */
  DecodingRuleMultibyte.prototype.match = function(buffer, opt_offset) {
    var offset = goog$4.isNumber(opt_offset) ? opt_offset : 0;
    if (!this.conditions_.length || !buffer) {
      return false;
    }
    if (buffer.length === 0 || buffer.length - offset <= 0) {
      return true;
    }

    var condition;
    for (var i = offset, length = buffer.length; i < length;) {
      condition = this.find_(buffer, i);
      if (!condition) {
        return false;
      }
      var origin = this.readUInt32BE_(buffer, i, condition.getBytes());
      if (this.convertChar_(origin) === consts$3.UNICODE_UNKNOWN_CHAR) {
        return false;
      }
      i += condition.getBytes();
    }

    return true;
  };

  /**
   * Search there is any Condition can consume the next bytes.
   * @private
   * @param {Uint8Array} buffer
   * @param {number} offset
   * @return {Condition}
   */
  DecodingRuleMultibyte.prototype.find_ = function(buffer, offset) {
    for (var i = 0, count = this.conditions_.length; i < count; ++i) {
      if (this.conditions_[i].consume(buffer, offset)) {
        return this.conditions_[i];
      }
    }
    return null;
  };

  /**
   * The parsed result is a Unicode code point.
   * @override
   * @param {Uint8Array} buffer
   * @param {number} offset
   * @param {Uint32Array} result
   * @param {number} pos
   * @return {number}
   */
  DecodingRuleMultibyte.prototype.consume = function (buffer, offset, result, pos) {
    var condition = this.find_(buffer, offset);
    if (!condition) {
      return 0;
    }

    var bytes = condition.getBytes();
    var origin = this.readUInt32BE_(buffer, offset, bytes);
    result[pos] = this.convertChar_(origin);
    return bytes;
  };

  /**
   * Read a code point from the buffer and return the decoded result.
   * @override
   * @param {Uint8Array} buffer
   * @param {number} offset
   * @return {?{
   *   consumed: number,
   *   decoded: string
   * }}
   */
  DecodingRuleMultibyte.prototype.read = function(buffer, offset) {
    var condition = this.find_(buffer, offset);
    if (!condition) {
      return null;
    }

    var bytes = condition.getBytes();
    var origin = this.readUInt32BE_(buffer, offset, bytes);
    var codepoint = this.convertChar_(origin);
    return {
      consumed: bytes,
      decoded: String.fromCodePoint(codepoint)
    };
  };

  /**
   * It is safe to accelerate the decoding without checking buffer boundary.
   * @private
   * @param {Uint8Array} buffer
   * @param {number} offset
   * @param {number} bytes
   * @return {number}
   */
  DecodingRuleMultibyte.prototype.readUInt32BE_ = function(buffer, offset, bytes) {
    var result = 0;
    for (var i = 0; i < bytes; ++i) {
      result |= buffer[offset + i] << (8 * (bytes - 1 - i));
    }
    return result >>> 0;
  };

  /**
   * Convert the MBCS code point to Unicode code point.
   * @private
   * @param {number} chr
   * @return {number}
   */
  DecodingRuleMultibyte.prototype.convertChar_ = function(chr) {
    chr = chr >>> 0;
    var seg = this.segments_.find(chr);
    if (!seg) {
      return consts$3.UNICODE_UNKNOWN_CHAR;
    }

    switch (seg.getReference()) {
      case segment.Reference.ASCII:
        return chr & 0x7F;
      case segment.Reference.UNDEFINED:
        return consts$3.UNICODE_UNKNOWN_CHAR;
      case segment.Reference.BUFFER:
        if (!this.mappingBuffer_) {
          return consts$3.UNICODE_UNKNOWN_CHAR;
        }
        return this.mappingBuffer_[chr - seg.getBegin() + seg.getOffset()];
      case segment.Reference.INDEXING_BUFFER:
        if (!this.mappingBuffer_) {
          return consts$3.UNICODE_UNKNOWN_CHAR;
        }
        var offset = this.getIndexingBufferOffset_(seg, chr);
        if (offset === -1) {
          return consts$3.UNICODE_UNKNOWN_CHAR;
        }
        return this.mappingBuffer_[offset + seg.getOffset()];
      case segment.Reference.SELF:
        return chr;
      case segment.Reference.GB18030_UNICODE_SP_MAPPING:
        return gb18030utils.convertGB18030ToUnicodeSP(chr);
      default:
        return consts$3.UNICODE_UNKNOWN_CHAR;
    }
  };

  /**
   * @private
   * @param {segment.Segment} seg
   * @param {number} chr
   * @return {number}
   */
  DecodingRuleMultibyte.prototype.getIndexingBufferOffset_ = function(seg, chr) {
    var condition = seg.getCondition();
    if (!condition) {
      return -1;
    }

    return condition.getIndexingOffset(chr);
  };

  decodingRule.Multibyte = DecodingRuleMultibyte;
  decodingRule.UTF16LE = new DecodingRuleUTF16LE();
  decodingRule.UTF16BE = new DecodingRuleUTF16BE();
  decodingRule.UTF8 = new DecodingRuleUTF8();

  /**
   * @author kuyur@kuyur.info
   */

  const { Charmap: Charmap$1, CharmapType: CharmapType$2 }= charmap;
  const consts$2 = consts$6;
  const decodingrule = decodingRule;
  const goog$3 = googBase;
  const base64$2 = base64$4;

  /**
   * Front-end Charmap class.
   * @constructor
   * @param {string} name
   * @extends {Charmap}
   */
  var Decoder = function(name) {
    Charmap$1.call(this, name, CharmapType$2.DECODER);
  };
  goog$3.inherits(Decoder, Charmap$1);

  /**
   * The rule of byte-reading.
   * @private
   * @type {decodingrule.DecodingRule}
   */
  Decoder.prototype.rule_;

  /**
   * Is the buffer matched the charmap or not.
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to test. 0 by default.
   * @return {boolean}
   */
  Decoder.prototype.match = goog$3.abstractMethod;

  /**
   * Decode the buffer and return Unicode code points. Use toString() method of
   * buffer-utils to convert the decoded buffer to string.
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
   * @return {Uint32Array}
   */
  Decoder.prototype.decode = goog$3.abstractMethod;

  /**
   * Decode the buffer and return JavaScript native string. Will remove the BOM
   * at the header if the BOM is existing.
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to parse. 0 by default.
   * @return {string}
   */
  Decoder.prototype.parse = goog$3.abstractMethod;

  /**
   * @constructor
   * @extends {Decoder}
   */
  var DecoderUtf16le = function() {
    Decoder.call(this, 'UTF-16LE');
    this.rule_ = decodingrule.UTF16LE;
  };
  goog$3.inherits(DecoderUtf16le, Decoder);

  /**
   * Is the buffer matched the charmap or not.
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to test. 0 by default.
   * @return {boolean}
   */
  DecoderUtf16le.prototype.match = function(buffer, opt_offset) {
    return this.rule_.match(buffer, opt_offset);
  };

  /**
   * Test the first 2 bytes matching with UTF16-LE BOM or not.
   * @param {Uint8Array} buffer
   * @return {boolean}
   */
  DecoderUtf16le.prototype.hasBom = function(buffer) {
    return buffer && buffer.length >= 2 && buffer[0] === consts$2.UTF16LE_BOM[0] &&
      buffer[1] === consts$2.UTF16LE_BOM[1];
  };

  /**
   * Decode the buffer and return Unicode code points.
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
   * @return {Uint32Array}
   */
  DecoderUtf16le.prototype.decode = function(buffer, opt_offset) {
    return this.rule_.decode(buffer, opt_offset);
  };

  /**
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
   * @return {string}
   */
  DecoderUtf16le.prototype.parse = function(buffer, opt_offset) {
    var result = this.rule_.parse(buffer, opt_offset);
    if (result && result.charCodeAt(0) === consts$2.UNICODE_BYTE_ORDER_MARK) {
      return result.substring(1);
    }
    return result;
  };

  /**
   * @constructor
   * @extends {Decoder}
   */
  var DecoderUtf16be = function() {
    Decoder.call(this, 'UTF-16BE');
    this.rule_ = decodingrule.UTF16BE;
  };
  goog$3.inherits(DecoderUtf16be, Decoder);

  /**
   * Is the buffer matched the charmap or not.
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to test. 0 by default.
   * @return {boolean}
   */
  DecoderUtf16be.prototype.match = function(buffer, opt_offset) {
    return this.rule_.match(buffer, opt_offset);
  };

  /**
   * Test the first 2 bytes matching with UTF16-BE BOM or not.
   * @param {Uint8Array} buffer
   * @return {boolean}
   */
  DecoderUtf16be.prototype.hasBom = function(buffer) {
    return buffer && buffer.length >= 2 && buffer[0] === consts$2.UTF16BE_BOM[0] &&
      buffer[1] === consts$2.UTF16BE_BOM[1];
  };

  /**
   * Decode the buffer and return Unicode code points.
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
   * @return {Uint32Array}
   */
  DecoderUtf16be.prototype.decode = function(buffer, opt_offset) {
    return this.rule_.decode(buffer, opt_offset);
  };

  /**
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
   * @return {string}
   */
  DecoderUtf16be.prototype.parse = function(buffer, opt_offset) {
    var result = this.rule_.parse(buffer, opt_offset);
    if (result && result.charCodeAt(0) === consts$2.UNICODE_BYTE_ORDER_MARK) {
      return result.substring(1);
    }
    return result;
  };

  /**
   * @constructor
   * @extends {Decoder}
   */
  var DecoderUtf8 = function() {
    Decoder.call(this, 'UTF-8');
    this.rule_ = decodingrule.UTF8;
  };
  goog$3.inherits(DecoderUtf8, Decoder);

  /**
   * Is the buffer matched the charmap or not.
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to test. 0 by default.
   * @return {boolean}
   */
  DecoderUtf8.prototype.match = function(buffer, opt_offset) {
    return this.rule_.match(buffer, opt_offset);
  };

  /**
   * Test the first 3 bytes matching with UTF8 BOM or not.
   * @param {Uint8Array} buffer
   * @return {boolean}
   */
  DecoderUtf8.prototype.hasBom = function(buffer) {
    return buffer && buffer.length >= 3 && buffer[0] === consts$2.UTF8_BOM[0] &&
      buffer[1] === consts$2.UTF8_BOM[1] && buffer[2] === consts$2.UTF8_BOM[2];
  };

  /**
   * Decode the buffer and return Unicode code points.
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
   * @return {Uint32Array}
   */
  DecoderUtf8.prototype.decode = function(buffer, opt_offset) {
    return this.rule_.decode(buffer, opt_offset);
  };

  /**
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
   * @return {string}
   */
  DecoderUtf8.prototype.parse = function(buffer, opt_offset) {
    var result = this.rule_.parse(buffer, opt_offset);
    if (result && result.charCodeAt(0) === consts$2.UNICODE_BYTE_ORDER_MARK) {
      return result.substring(1);
    }
    return result;
  };

  /**
   * Front-end MBCS Charmap class.
   * @param {{
   *   name: string,
   *   description: string,
   *   version: string,
   *   buffer: Uint16Array|Uint32Array|string,
   *   byte: ?number,
   *   rules: Array.<Object>,
   *   segments: Array.<Object>
   * }} options
   * @constructor
   * @extends {Decoder}
   */
  var DecoderMultibyte = function(options) {
    if (!options || !options.name) {
      throw 'options should provide name property at least';
    }
    Decoder.call(this, options.name);

    this.description_ = options.description;
    this.version_ = options.version;

    var mappingBuffer = null;
    if (options.buffer) {
      if ((options.buffer instanceof Uint16Array) || (options.buffer instanceof Uint32Array)) {
        mappingBuffer = options.buffer;
      } else if (goog$3.isString(options.buffer)) {
        if (options.buffer.startsWith(consts$2.EMBEDDED_BASE64_PREFIX)) {
          var encoded = options.buffer.substring(consts$2.EMBEDDED_BASE64_PREFIX.length);
          var charmap = base64$2.decode(encoded.trim());
          mappingBuffer = options.byte === 2 ? new Uint16Array(charmap.buffer) : new Uint32Array(charmap.buffer);
        }
      }
    }

    this.rule_ = new decodingrule.Multibyte(options.rules, options.segments, mappingBuffer);
  };
  goog$3.inherits(DecoderMultibyte, Decoder);

  /**
   * Get bytes of one code point inside mapping buffer.
   * @return {number}
   */
  DecoderMultibyte.prototype.getBytesOfCodepoint = function() {
    return this.rule_.getBytesOfCodepoint();
  };

  /**
   * Is the buffer matched the MBCS charmap or not. If there is any code point
   * mapped to 0xFFFD, it is considered that buffer is not matched.
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to test. 0 by default.
   * @return {boolean}
   */
  DecoderMultibyte.prototype.match = function(buffer, opt_offset) {
    return this.rule_.match(buffer, opt_offset);
  };

  /**
   * Decode the buffer and return Unicode code points.
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
   * @return {Uint32Array}
   */
  DecoderMultibyte.prototype.decode = function(buffer, opt_offset) {
    return this.rule_.decode(buffer, opt_offset);
  };

  /**
   * @override
   * @param {Uint8Array} buffer
   * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
   * @return {string}
   */
  DecoderMultibyte.prototype.parse = function(buffer, opt_offset) {
    return this.rule_.parse(buffer, opt_offset);
  };

  decoder$2.UTF16LE = new DecoderUtf16le();
  decoder$2.UTF16BE = new DecoderUtf16be();
  decoder$2.UTF8 = new DecoderUtf8();
  decoder$2.Decoder = Decoder;
  decoder$2.Multibyte = DecoderMultibyte;

  var encoder$2 = {};

  /**
   * @author kuyur@kuyur.info
   */

  const { Charmap, CharmapType: CharmapType$1 } = charmap;
  const consts$1 = consts$6;
  const encodingrule = encodingRule;
  const goog$2 = googBase;
  const base64$1 = base64$4;

  /**
   * Back-end Charmap class.
   * @constructor
   * @param {string} name
   * @extends {Charmap}
   */
  var Encoder = function(name) {
    Charmap.call(this, name, CharmapType$1.ENCODER);
  };
  goog$2.inherits(Encoder, Charmap);

  /**
   * @private
   * @type {encodingrule.EncodingRule}
   */
  Encoder.prototype.rule_;

  /**
   * Encode the Unicode code points and return encoded buffer.
   * @param {Uint32Array} buffer
   * @return {Uint8Array}
   */
  Encoder.prototype.encode = goog$2.abstractMethod;

  /**
   * Encode the JavaScript string and return encoded buffer.
   * @param {string} str
   * @param {?boolean} opt_appendBOM
   * @return {Uint8Array}
   */
  Encoder.prototype.unparse = goog$2.abstractMethod;

  /**
   * @constructor
   * @extends {Encoder}
   */
  var EncoderUtf16le = function() {
    Encoder.call(this, 'UTF-16LE');
    this.rule_ = encodingrule.UTF16LE;
  };
  goog$2.inherits(EncoderUtf16le, Encoder);

  /**
   * @override
   * @param {Uint32Array} buffer
   * @return {Uint8Array}
   */
  EncoderUtf16le.prototype.encode = function(buffer) {
    return this.rule_.encode(buffer);
  };

  /**
   * @override
   * @param {string} str
   * @param {?boolean} opt_appendBOM
   * @return {Uint8Array}
   */
  EncoderUtf16le.prototype.unparse = function(str, opt_appendBOM) {
    if (!goog$2.isString(str)) {
      throw 'Error: invalid type for str.';
    }

    if (opt_appendBOM) {
      if (str.codePointAt(0) !== consts$1.UNICODE_BYTE_ORDER_MARK) {
        str = String.fromCodePoint(consts$1.UNICODE_BYTE_ORDER_MARK) + str;
      }
    }

    return this.rule_.unparse(str);
  };

  /**
   * @constructor
   * @extends {Encoder}
   */
  var EncoderUtf16be = function() {
    Encoder.call(this, 'UTF-16BE');
    this.rule_ = encodingrule.UTF16BE;
  };
  goog$2.inherits(EncoderUtf16be, Encoder);

  /**
   * @override
   * @param {Uint32Array} buffer
   * @return {Uint8Array}
   */
  EncoderUtf16be.prototype.encode = function(buffer) {
    return this.rule_.encode(buffer);
  };

  /**
   * @override
   * @param {string} str
   * @param {?boolean} opt_appendBOM
   * @return {Uint8Array}
   */
  EncoderUtf16be.prototype.unparse = function(str, opt_appendBOM) {
    if (!goog$2.isString(str)) {
      throw 'Error: invalid type for str.';
    }

    if (opt_appendBOM) {
      if (str.codePointAt(0) !== consts$1.UNICODE_BYTE_ORDER_MARK) {
        str = String.fromCodePoint(consts$1.UNICODE_BYTE_ORDER_MARK) + str;
      }
    }

    return this.rule_.unparse(str);
  };

  /**
   * @constructor
   * @extends {Encoder}
   */
  var EncoderUtf8 = function() {
    Encoder.call(this, 'UTF-8');
    this.rule_ = encodingrule.UTF8;
  };
  goog$2.inherits(EncoderUtf8, Encoder);

  /**
   * @override
   * @param {Uint32Array} buffer
   * @return {Uint8Array}
   */
  EncoderUtf8.prototype.encode = function(buffer) {
    return this.rule_.encode(buffer);
  };

  /**
   * @override
   * @param {string} str
   * @param {?boolean} opt_appendBOM
   * @return {Uint8Array}
   */
  EncoderUtf8.prototype.unparse = function(str, opt_appendBOM) {
    if (!goog$2.isString(str)) {
      throw 'Error: invalid type for str.';
    }

    if (opt_appendBOM) {
      if (str.codePointAt(0) !== consts$1.UNICODE_BYTE_ORDER_MARK) {
        str = String.fromCodePoint(consts$1.UNICODE_BYTE_ORDER_MARK) + str;
      }
    }

    return this.rule_.unparse(str);
  };

  /**
   * Multibyte Encoder class.
   * @param {{
   *   name: string,
   *   description: string,
   *   version: string,
   *   buffer: Uint16Array|Uint32Array|string,
   *   byte: number,
   *   segments: Array.<Object>
   * }} options
   * @extends {Encoder}
   */
  var EncoderMultibyte = function(options) {
    if (!options || !options.name) {
      throw 'options should provide name property at least';
    }
    Encoder.call(this, options.name);

    this.description_ = options.description;
    this.version_ = options.version;

    var mappingBuffer = null;
    if (options.buffer) {
      if ((options.buffer instanceof Uint16Array) || (options.buffer instanceof Uint32Array)) {
        mappingBuffer = options.buffer;
      } else if (goog$2.isString(options.buffer)) {
        if (options.buffer.startsWith(consts$1.EMBEDDED_BASE64_PREFIX)) {
          var encoded = options.buffer.substring(consts$1.EMBEDDED_BASE64_PREFIX.length);
          var charmap = base64$1.decode(encoded.trim());
          mappingBuffer = options.byte === 2 ? new Uint16Array(charmap.buffer) : new Uint32Array(charmap.buffer);
        }
      }
    }

    this.rule_ = new encodingrule.Multibyte(options.segments, mappingBuffer, consts$1.MBCS_UNKNOWN_CHAR);
  };
  goog$2.inherits(EncoderMultibyte, Encoder);

  /**
   * Get bytes of one code point inside mapping buffer.
   * @return {number}
   */
  EncoderMultibyte.prototype.getBytesOfCodepoint = function() {
    return this.rule_.getBytesOfCodepoint();
  };

  /**
   * @override
   * @param {Uint32Array} buffer
   * @return {Uint8Array}
   */
  EncoderMultibyte.prototype.encode = function(buffer) {
    return this.rule_.encode(buffer);
  };

  /**
   * @override
   * @param {string} str
   * @return {Uint8Array}
   */
  EncoderMultibyte.prototype.unparse = function(str) {
    if (!goog$2.isString(str)) {
      throw 'Error: invalid type for str.';
    }

    return this.rule_.unparse(str);
  };

  encoder$2.UTF16LE = new EncoderUtf16le();
  encoder$2.UTF16BE = new EncoderUtf16be();
  encoder$2.UTF8 = new EncoderUtf8();
  encoder$2.Encoder = Encoder;
  encoder$2.Multibyte = EncoderMultibyte;

  var context = {};

  /**
   * @author kuyur@kuyur.info
   */

  const { Channel: Channel$1 } = channel;
  const { Converter: Converter$1 } = converter;
  const decoder$1 = decoder$2;
  const encoder$1 = encoder$2;
  const goog$1 = googBase;

  /**
   * Context Class.
   * @constructor
   * @param {Object} configs
   */
  var Context$2 = function(configs) {
    this.reload(configs);
  };

  /**
   * @type {Object.<string, encoder.Encoder>}}
   * @private
  */
  Context$2.prototype.encoders_;

  /**
   * @type {Object.<string, decoder.Decoder>}
   * @private
   */
  Context$2.prototype.decoders_;

  /**
   * @type {Object.<string, Converter>}
   * @private
   */
  Context$2.prototype.converters_;

  /**
   * @type {Object.<string, Channel>}
   * @private
   */
  Context$2.prototype.channels_;

  /**
   * @type {Array.<string>}
   * @private
   */
  Context$2.prototype.detectionOrder_;

  /**
   * Reload configuration.
   * @param {Object} configs
   */
  Context$2.prototype.reload = function(configs) {
    this.decoders_ = {};
    this.decoders_[decoder$1.UTF8.getName()] = decoder$1.UTF8;
    this.decoders_[decoder$1.UTF16LE.getName()] = decoder$1.UTF16LE;
    this.decoders_[decoder$1.UTF16BE.getName()] = decoder$1.UTF16BE;

    this.encoders_ = {};
    this.encoders_[encoder$1.UTF8.getName()] = encoder$1.UTF8;
    this.encoders_[encoder$1.UTF16LE.getName()] = encoder$1.UTF16LE;
    this.encoders_[encoder$1.UTF16BE.getName()] = encoder$1.UTF16BE;

    this.converters_ = {};
    this.detectionOrder_ = [];
    this.channels_ = {};

    if (configs) {
      // external decoders
      if (goog$1.isArray(configs.decoders)) {
        configs.decoders.forEach(config => {
          var dec = new decoder$1.Multibyte(config);
          this.decoders_[dec.getName()] = dec;
        }, this);
      }

      // detection order
      if (goog$1.isArray(configs.detection_order)) {
        this.detectionOrder_ = configs.detection_order.slice();
      }

      // external encoders
      if (goog$1.isArray(configs.encoders)) {
        configs.encoders.forEach(config => {
          var enc = new encoder$1.Multibyte(config);
          this.encoders_[enc.getName()] = enc;
        }, this);
      }

      // external converters
      if (goog$1.isArray(configs.converters)) {
        configs.converters.forEach(config => {
          var conv = new Converter$1(config);
          this.converters_[conv.getName()] = conv;
        }, this);
      }

      // channels
      if (goog$1.isArray(configs.channels)) {
        configs.channels.forEach(config => {
          this.newChannel(config.name, config.decoder, config.encoder, config.converters);
        }, this);
      }
    }
  };

  /**
   * Get decoder by name.
   * @param {string} name
   * @return {?decoder.Decoder}
   */
  Context$2.prototype.getDecoder = function(name) {
    return this.decoders_[name];
  };

  /**
   * Get name list of all decoders.
   * @return {Array.<string>}
   */
  Context$2.prototype.getDecoderNames = function() {
    return Object.keys(this.decoders_);
  };

  /**
   * Get encoder by name.
   * @param {string} name
   * @return {?encoder.Encoder}
   */
  Context$2.prototype.getEncoder = function(name) {
    return this.encoders_[name];
  };

  /**
   * Get name list of all encoders.
   * @return {Array.<string>}
   */
  Context$2.prototype.getEncoderNames = function() {
    return Object.keys(this.encoders_);
  };

  /**
   * Get converter by name.
   * @param {string} name
   * @return {?Converter}
   */
  Context$2.prototype.getConverter = function(name) {
    return this.converters_[name];
  };

  /**
   * Get name list of all converters.
   * @return {Array.<string>}
   */
  Context$2.prototype.getConverterNames = function() {
    return Object.keys(this.converters_);
  };

  /**
   * Get channel by name.
   * @param {string} name
   * @return {?Channel}
   */
  Context$2.prototype.getChannel = function(name) {
    return this.channels_[name];
  };

  /**
   * Get name list of all channels.
   * @return {Array.<string>}
   */
  Context$2.prototype.getChannelNames = function() {
    return Object.keys(this.channels_);
  };

  /**
   * Create a new channel from existing charmaps.
   * @param {string} name name of the new channel.
   * @param {string} decoderName name of decoder.
   * @param {string} encoderName name of encoder.
   * @param {?(string|Array.<string>)} opt_converters name list of converters.
   * @return {?Channel}
   */
  Context$2.prototype.newChannel = function(name, decoderName, encoderName, opt_converters) {
    if (!this.decoders_[decoderName] || !this.encoders_[encoderName]) {
      return null;
    }

    var converters = [];
    if (opt_converters) {
      if (goog$1.isString(opt_converters)) {
        if (this.converters_[opt_converters]) {
          converters.push(this.converters_[opt_converters]);
        }
      } else if (goog$1.isArray(opt_converters)) {
        opt_converters.forEach(name => {
          if (this.converters_[name]) {
            converters.push(this.converters_[name]);
          }
        }, this);
      }
    }

    return this.channels_[name] = new Channel$1(this.decoders_[decoderName], this.encoders_[encoderName], converters);
  };

  /**
   * Decode the buffer and return Unicode code points. Notice that no additional
   * BOM handling in this method. This function is a shortcut for the code in example.
   * @example
   *   var dec = context.getDecoder(decoder);
   *   var output = dec.decode(buffer, opt_offset);
   * @param {Uint8Array} buffer input buffer to decode.
   * @param {string} decoderName name of decoder.
   * @return {Uint32Array} Unicode code points.
   */
  Context$2.prototype.decode = function(buffer, decoderName, opt_offset) {
    var dec = this.getDecoder(decoderName);
    if (!dec) {
      throw `Error: decoder ${decoderName} not found in the context.`;
    }
    return dec.decode(buffer, opt_offset);
  };

  /**
   * Encode the Unicode code points with specified encoding. Notice that no
   * additional BOM handling in this method even UTF-8/UTF-16LE/UTF-16BE
   * is specified. This function is a shortcut for the code in example.
   * @example
   *   var enc = context.getEncoder(encoder);
   *   var output = enc.encode(buffer);
   * @param {Uint32Array} buffer the buffer to encode. Every element in the
   *   buffer must be a Unicode code points.
   * @param {string} encoderName name of decoder.
   * @return {Uint8Array} encoded buffer (binary data) which can be written to file directly.
   */
  Context$2.prototype.encode = function(buffer, encoderName) {
    var enc = this.getEncoder(encoderName);
    if (!enc) {
      throw `Error: encoder ${encoderName} not found in the context.`;
    }
    return enc.encode(buffer);
  };

  /**
   * Decode the buffer and return a javascript string. Will remove the BOM at the header
   * automatically if the BOM is existing.
   * @param {Uint8Array} buffer input buffer to decode.
   * @param {string} decoderName name of decoder.
   * @param {?number} opt_offset the start position in buffer to decode. 0 by default.
   * @return {string} decoded javascript string.
   */
  Context$2.prototype.parse = function(buffer, decoderName, opt_offset) {
    var dec = this.getDecoder(decoderName);
    if (!dec) {
      throw `Error: decoder ${decoderName} not found in the context.`;
    }

    return dec.parse(buffer, opt_offset);
  };

  /**
   * Encode a javascript string with the specified encoding. BOM will be attached to the
   * encoded buffer if UTF-8/UTF-16LE/UTF-16BE is specified and opt_appendBOM is set to
   * true.
   * @param {string} str the javascript string to encode.
   * @param {string} encoderName name of encoder.
   * @param {?boolean} opt_appendBOM attach the BOM to header if the parameter is set
   *   as true. false by default. Only used for UTF-8/UTF-16LE/UTF-16BE.
   * @return {Uint8Array} encoded buffer (binary data) which can be written to file directly.
   */
  Context$2.prototype.unparse = function(str, encoderName, opt_appendBOM) {
    var enc = this.getEncoder(encoderName);
    if (!enc) {
      throw `Error: encoder ${encoderName} not found in the context.`;
    }

    return enc.unparse(str, opt_appendBOM);
  };

  /**
   * Guess the possible encoding (name of decoder) of input buffer. If not found, will
   * return null. The detection order is : UTF8 (w/o BOM) -> UTF16LE with BOM ->
   * UTF16BE with BOM -> external charmaps.
   * @param {Uint8Array} buffer input buffer.
   * @return {?{
   *   encoding: string,
   *   hasBom: boolean
   * }}
   */
  Context$2.prototype.findPossibleEncoding = function(buffer) {
    if (decoder$1.UTF8.match(buffer)) {
      return {
        encoding: decoder$1.UTF8.getName(),
        hasBom: decoder$1.UTF8.hasBom(buffer)
      };
    }

    if (decoder$1.UTF16LE.hasBom(buffer) && decoder$1.UTF16LE.match(buffer)) {
      return {
        encoding: decoder$1.UTF16LE.getName(),
        hasBom: true
      };
    }

    if (decoder$1.UTF16BE.hasBom(buffer) && decoder$1.UTF16BE.match(buffer)) {
      return {
        encoding: decoder$1.UTF16BE.getName(),
        hasBom: true
      };
    }

    var found = this.detectionOrder_.find(name => {
      var dec = this.getDecoder(name);
      return dec && dec.match(buffer);
    }, this);

    if (found) {
      return {
        encoding: found,
        hasBom: false
      };
    }

    return null;
  };

  context.Context = Context$2;

  var loadFromUrl$1 = {};

  /**
   * @author kuyur@kuyur.info
   */

  const { Context: Context$1 } = context;
  const goog = googBase;
  const consts = consts$6;

  /**
   * Create a Context instance by loading configuration from a URL. (for browser)
   * @param {string} url url of configuration file.
   * @return {Promise.<Context>}
   */
  loadFromUrl$1.loadFromUrl = function(url) {
    var promise = fetch(url).then(response => response.json());

    var loadBuffer = function(option) {
      if (goog.isString(option.buffer) && !option.buffer.startsWith(consts.EMBEDDED_BASE64_PREFIX)) {
        return fetch(option.buffer).then(response => response.arrayBuffer()).then(charmap => {
          option.buffer = option.byte === 2 ? new Uint16Array(charmap) : new Uint32Array(charmap);
        });
      } else {
        return Promise.resolve();
      }
    };

    promise = promise.then(configs => {
      var promises = [];

      // loop decoders
      if (goog.isArray(configs.decoders)) {
        configs.decoders.forEach(option => {
          promises.push(loadBuffer(option));
        });
      }

      // loop encoders
      if (goog.isArray(configs.encoders)) {
        configs.encoders.forEach(option => {
          promises.push(loadBuffer(option));
        });
      }

      // loop converters
      if (goog.isArray(configs.converters)) {
        configs.converters.forEach(option => {
          promises.push(loadBuffer(option));
        });
      }

      return Promise.all(promises).then(() => configs);
    });

    return promise.then(configs => {
      return new Context$1(configs);
    });
  };

  const BufferUtils = bufferUtils;
  const UtfUtils = utfUtils;
  const { Channel } = channel;
  const { CharmapType } = charmap;
  const { Condition } = condition;
  const Consts = consts$6;
  const { Converter }= converter;
  const decoder = decoder$2;
  const encoder = encoder$2;
  const { Reference } = segment$3;
  const { Context } = context;
  const base64 = base64$4;
  const { loadFromUrl } = loadFromUrl$1;

  var browserLite = {
    Converter: Converter,
    DecoderMultibyte: decoder.Multibyte,
    DECODER_UTF8: decoder.UTF8,
    DECODER_UTF16LE: decoder.UTF16LE,
    DECODER_UTF16BE: decoder.UTF16BE,
    EncoderMultibyte: encoder.Multibyte,
    ENCODER_UTF8: encoder.UTF8,
    ENCODER_UTF16LE: encoder.UTF16LE,
    ENCODER_UTF16BE: encoder.UTF16BE,
    Channel: Channel,
    Condition: Condition,
    CharmapType: CharmapType,
    SegmentReference: Reference,
    Context: Context,
    Consts: Consts,
    utils: {
      buffer: BufferUtils,
      utf: UtfUtils,
      base64: base64
    },
    loadFromUrl: loadFromUrl
  };

  return browserLite;

}));
