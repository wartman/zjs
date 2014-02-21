/**
 * ----------------------------------------------------------------------
 * z.u
 *
 * z's utility functions.
 */

/**
 * u api
 * Based on underscore, and can be used in OOP mode in much the 
 * same way.
 *
 * @param {Mixed} obj
 * @return {u} Always returns an instance;
 */
var u = function(obj){
  if(obj instanceof u){
    return obj; 
  }
  if(!(this instanceof u)){ 
    return new u(obj); 
  }
  this._chain = true;
  this._obj = obj;
}

/**
 * Save a few bytes in minified form
 */
var ArrayProto = Array.prototype
  , ObjProto = Object.prototype
  , FuncProto = Function.prototype
  , undef;

/**
 * Shortcuts to often used core prototypes.
 */
var push             = ArrayProto.push
  , slice            = ArrayProto.slice
  , concat           = ArrayProto.concat
  , toString         = ObjProto.toString
  , hasOwnProperty   = ObjProto.hasOwnProperty;

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
u._idIndex = 0;
u.uniqueId = function(prefix){
  u._idIndex++;
  return prefix + u._idIndex;
}

/**
 * Check if item is an array.
 * Default to the native implementation if it exists.
 *
 * @param {Mixed} item
 * @return {Boolean}
 */ 
u.isArray = (Array.isArray || function(item){
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
u.each = function(obj, callback, context) {
  if(null === obj){
    return obj;
  }
  context = (context || obj);
  if(nativeForEach && obj.forEach){
    obj.forEach(callback)
  } else if ( u.isArray(obj) ){
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
u.eachReverse = function(obj, callback, context) {
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
 * Defines u.isArguments, u.isFunction etc.
 * Presumably, you can figure out what they should do.
 */
u.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
  u['is' + name] = function(obj) {
    return toString.call(obj) == '[object ' + name + ']';
  };
});

/**
 * Check if passed var is undefined.
 */
u.isUndefined = function(obj) {
  return obj === void 0;
};

/**
 * Check if passed var is an object.
 */
u.isObject = function(obj){
  return obj === Object(obj);
}

/**
 * Extend an object or objects.
 *
 * @param {Object} obj The object to extend.
 * @param {Object} ... Each additional arg will be passed into the first obj.
 * @return {Object}
 */
u.extend = function(obj){
  u.each(slice.call(arguments, 1), function(source){
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
u.clone = function(obj){
  if(null === obj || false === u.isObject(obj)){
    return obj;
  }
  return u.isArray(obj)? obj.slice() : u.extend({}, obj);
}

/**
 * Get all keys in an object.
 * Uses the native Object.keys if available.
 *
 * @return {Array}
 */
u.keys = function(obj){
  if(!u.isObject(obj)) return [];
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
u.values = function(obj){
  var vals = []
    , keys = u.keys(obj) // Ensures that keys and vals will match up with both methods.
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
u.defaults = function(obj, options){
  var clone = u.clone(obj);
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
u.extract = function(obj, from, apply){
  apply = (apply || {});
  u.each(obj, function(key){
    if(from.hasOwnProperty(key)){
      if(apply.hasOwnProperty(key) && u.isObject(apply[key])){
        // Don't overwrite an existing object
        apply[key] = u.extend(apply[key], from[key]);
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
u.once = function(obj, ctx) {
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
u.isEmpty = function(obj){
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
u.chain = function(obj){
  return u(obj).chain();
}

/**
 * Check if a number OR string is numeric.
 * Unlike u.isNumber, isNumeric will return true for both of the
 * following examples:
 *   u.isNumeric(1); // true
 *   u.isNumeric("1"); // true
 *
 * @param {Number||String} obj
 * @return {Boolean}
 */
u.isNumeric = function(obj){
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
var uResult = function(obj){
  return this._chain ? u(obj).chain() : obj;
}

/**
 * Add functions to the prototype to allow for underscore-style oop
 * All methods are chainable.
 */
u.each(u, function(func, key){
  if(u.isFunction(func)){
    u.prototype[key] = function(){
      var args = [this._obj];
      push.apply(args, arguments);
      return uResult.call(this, func.apply(u, args));
    }
  }
});

u.prototype.chain = function(){
  this._chain = true;
  return this;
}

u.prototype.value = function(){
  return this._obj;
}