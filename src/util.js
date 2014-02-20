  /**
   * ----------------------------------------------------------------------
   * z.util
   *
   * Fit's utility classes and functions.
   */

  /**
   * z.util api
   * Based on underscore, and can be used in OOP mode in much the 
   * same way.
   *
   * @param {Mixed} obj
   * @return {z.util} Always returns an instance;
   */
  var util = z.util = function(obj){
    if(obj instanceof z.util){
      return obj; 
    }
    if(!(this instanceof z.util)){ 
      return new z.util(obj); 
    }
    this._chain = true;
    this._obj = obj;
  }

  // Look for native ECMAScript5 functions.
  var nativeForEach      = ArrayProto.forEach
    , nativeMap          = ArrayProto.map
    , nativeReduce       = ArrayProto.reduce
    , nativeReduceRight  = ArrayProto.reduceRight
    , nativeFilter       = ArrayProto.filter
    , nativeEvery        = ArrayProto.every
    , nativeSome         = ArrayProto.some
    , nativeIndexOf      = ArrayProto.indexOf
    , nativeLastIndexOf  = ArrayProto.lastIndexOf
    , nativeKeys         = Object.keys;

  /**
   * Create a unique id.
   *
   * @param {String} prefix
   * @return {String}
   */
  util._idIndex = 0;
  util.uniqueId = function(prefix){
    util._idIndex++;
    return prefix + util._idIndex;
  }

  /**
   * Check if item is an array.
   * Default to the native implementation if it exists.
   *
   * @param {Mixed} item
   * @return {Boolean}
   */ 
  util.isArray = (Array.isArray || function(item){
    return toString.call(obj) == '[object Array]';
  });

  /**
   * Iterate over an array or object. Return {true} to break.
   * The callback accepts the follwing arguments:
   *    function(value, key, items){ ... }
   * Will break the loop if truthy.
   *
   * @param {Mixed} obj An Array or Object to iterate over.
   * @param {Function} callback
   * @param {Object} context Set 'this'
   * @return {Object}
   */
  util.each = function(obj, callback, context) {
    if(null === obj){
      return obj;
    }
    context = (context || obj);
    if(nativeForEach && obj.forEach){
      obj.forEach(callback)
    } else if ( util.isArray(obj) ){
      for (var i = 0; i < obj.length; i += 1) {
        if (obj[i] && callback.call(context, obj[i], i, obj)) {
          break;
        }
      }
    } else {
      for(var key in obj){
        if(obj.hasOwnProperty(key)){
          if(key && callback.call(context, obj[key], key, obj)){
            break
          }
        }
      }
    }
    return obj;
  }

  /**
   * Iterate over an array backwards. Return {true} to break.
   * The callback accepts the follwing arguments:
   *    function(value, key, items){ ... }
   * Will break the loop if truthy.
   *
   * @param {Array} obj An Array to iterate over.
   * @param {Function} callback
   * @param {Object} context Set 'this'
   * @return {Undefined}
   */
  util.eachReverse = function(obj, callback, context) {
    if (obj) {
      var i;
      for (i = obj.length - 1; i > -1; i -= 1) {
        if (obj[i] && callback.call(context, obj[i], i, obj)) {
          break;
        }
      }
    }
    return obj;
  }

  /**
   * Defines z.util.isArguments, z.util.isFunction etc.
   * Presumably, you can figure out what they should do.
   */
  util.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    z.util['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  /**
   * Check if passed var is undefined.
   */
  util.isUndefined = function(obj) {
    return obj === void 0;
  };

  /**
   * Check if passed var is an object.
   */
  util.isObject = function(obj){
    return obj === Object(obj);
  }

  /**
   * Extend an object or objects.
   *
   * @param {Object} obj The object to extend.
   * @param {Object} ... Each additional arg will be passed into the first obj.
   * @return {Object}
   */
  util.extend = function(obj){
    z.util.each(slice.call(arguments, 1), function(source){
      if(source){
        for(var prop in source){
          obj[prop] = source[prop]
        }
      }
    });
    return obj;
  }

  /**
   * Make a shallow-copy of an object.
   *
   * @param {Object} obj The object to clone
   * @return {Object}
   */
  util.clone = function(obj){
    if(null === obj || false === z.util.isObject(obj)){
      return obj;
    }
    return util.isArray(obj)? obj.slice() : z.util.extend({}, obj);
  }

  /**
   * Get all keys in an object.
   * Uses the native Object.keys if available.
   *
   * @return {Array}
   */
  util.keys = function(obj){
    if(!util.isObject(obj)) return [];
    if(nativeKeys) return nativeKeys(obj);
    var keys = [];
    for(var key in obj){
      keys.push(key);
    }
    return keys;
  }

  /**
   * Get values from an object and place them in an array.
   *
   * @return {array}
   */
  util.values = function(obj){
    var vals = []
      , keys = util.keys(obj) // Ensures that keys and vals will match up with both methods.
      , length = keys.length;
    for(var i = 0; i < length; i += 1){
      vals[i] = obj(keys[i]);
    }
    return vals;
  }

  /**
   * Fill in an options object-literal with default values.
   *
   * @param {Object} obj
   * @param {Object} options
   * @return {Object}
   */
  util.defaults = function(obj, options){
    var clone = util.clone(obj);
    if(undefined === options){
      return clone;
    }
    for(var key in clone){
      if(clone.hasOwnProperty(key) && ! options.hasOwnProperty(key)){
        options[key] = clone[key];
      }
    }
    return options;
  }

  /**
   * Extract items from an object and apply them to another.
   *
   * @param {Array} obj
   * @param {Object} from
   * @param {Object} apply
   * @return {Undefined}
   */
  util.extract = function(obj, from, apply){
    apply = (apply || {});
    util.each(obj, function(key){
      if(from.hasOwnProperty(key)){
        if(apply.hasOwnProperty(key) && z.util.isObject(apply[key])){
          // Don't overwrite an existing object
          apply[key] = z.util.extend(apply[key], from[key]);
        } else {
          apply[key] = from[key];
        }
        delete from[key];
      }
    });
    return apply;
  }

  /**
   * Only run a function once, no matter how many times you call it.
   * (per Underscore)
   *
   * @param {Function} obj
   * @return {Function}
   */
  util.once = function(obj, ctx) {
    var ran = false, memo;
    ctx = (ctx || this);
    return function() {
      if (ran) return memo;
      ran = true;
      memo = obj.apply(ctx, arguments);
      obj = null;
      return memo;
    };
  }

  /**
   * Check to see if an object (of any type) is empty.
   *
   * @param {Object} Obj
   * @return {Boolean}
   */
  util.isEmpty = function(obj){
    if (obj == null){
      return true;
    } 
    if (obj instanceof Array || obj instanceof String){
      return obj.length === 0;
    }
    for (var key in obj){ // Does not handle enum bugs in ie <9
      if(obj.hasOwnProperty(key)){
        return false;
      }
    }
    return true;
  }

  /**
   * Start chianing an object.
   *
   * @param {Mixed} obj
   */
  util.chain = function(obj){
    return z.util(obj).chain();
  }

  /**
   * Check if a number OR string is numeric.
   * Unlike z.util.isNumber, isNumeric will return true for both of the
   * following examples:
   *   z.util.isNumeric(1); // true
   *   z.util.isNumeric("1"); // true
   *
   * @param {Number||String} obj
   * @return {Boolean}
   */
  util.isNumeric = function(obj){
    // parseFloat NaNs numeric-cast false positives (null|true|false|"")
    // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
    // subtraction forces infinities to NaN
    return obj - parseFloat( obj ) >= 0;
  }

  /**
   * Helper to chain results.
   *
   * @param {Mixed} obj
   */
  var utilResult = function(obj){
    return this._chain ? z.util(obj).chain() : obj;
  }

  /**
   * Add functions to the prototype to allow for underscore-style oop
   * All methods are chainable.
   */
  util.each(util, function(func, key){
    if(util.isFunction(func)){
      util.prototype[key] = function(){
        var args = [this._obj];
        push.apply(args, arguments);
        return utilResult.call(this, func.apply(util, args));
      }
    }
  });

  util.prototype.chain = function(){
    this._chain = true;
    return this;
  }

  util.prototype.value = function(){
    return this._obj;
  }

  /**
   * A shorter way to use util.
   */
  z.u = z.util;