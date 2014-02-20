

/**
 * zjs 0.0.8
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: 2014-02-20T22:19Z
 */

(function(global, factory){

  // For CommonJS environments.
  if ( typeof module === "object" && typeof module.exports === "object" ) {
    global = module.exports;
  }
  
  factory( global );

}( typeof window !== "undefined" ? window : this, function( root ) {


  /**
   * ----------------------------------------------------------------------
   * z.core
   * 
   * Definitions, bootstraping, etc for z.
   */

  /**
   * Fit's root-level namespace.
   *
   * @var {Object}
   */
  var z = root.z = {};

  /**
   * Save a few bytes in minified form
   */
  var ArrayProto = Array.prototype
    , ObjProto = Object.prototype
    , FuncProto = Function.prototype;

  /**
   * Shortcuts to often used core prototypes.
   */
  var push             = ArrayProto.push
    , slice            = ArrayProto.slice
    , concat           = ArrayProto.concat
    , toString         = ObjProto.toString
    , hasOwnProperty   = ObjProto.hasOwnProperty;

  /**
   * Default configuration for z.
   *
   * @var {Object}
   */
  z.config = {
    module: {
      root: '',
      shim: {},
      alias: {}
    },
    env: 'browser'
  };

  /**
   * Setup z.
   *
   * @param {Object} options
   * @return {Undefined}
   */
  z.setup = function(options){
    for(var key in options){
      if(options.hasOwnProperty(key)){
        z.config[key] = z.util.defaults(z.config[key], options[key]);   
      }
    }
    z.module.setup(z.config.module);
  }

  /**
   * Run when the DOM is ready (similar to jQuery.isReady)
   * Based on (with some changes):
   *
   *  contentloaded.js
   *
   *  Author: Diego Perini (diego.perini at gmail.com)
   *  Summary: cross-browser wrapper for DOMContentLoaded
   *  Updated: 20101020
   *  License: MIT
   *  Version: 1.2
   *
   *  URL:
   *  http://javascript.nwbox.com/ContentLoaded/
   *  http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
   *
   *
   * @parm {Function} next
   * @return {Undefined}
   */

  z.boot = function(next){
    // to do: needs to know if it's in Node.js context

    var done = false
      , top = true
      , doc = root.document
      , el = doc.documentElement
      , add = doc.addEventListener ? 'addEventListener' : 'attachEvent'
      , rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent'
      , pre = doc.addEventListener ? '' : 'on'
      ;

    init = function(e){
      if(e.type == 'readystatechange' && doc.readyState != 'complete'){
        return;
      }
      (e.type == 'load' ? root : doc)[rem](pre + e.type, init, false);
      if(!done && (done = true)){
        next.call(root, e.type || e);
      }
    }

    // A hack for really out of date browsers (ie)
    poll = function(){
      try{ el.doScroll('left') } catch(e){ setTimeout(poll, 50); return; }
      init('poll');
    }

    if(doc.readyState == 'complete'){
      next.call(root, 'lazy');
    } else {
      if( doc.createEventObject && el.doScroll ){
        try{ top = !win.frameElement; } catch(e) { }
        if(top){ poll(); }
      }
      doc[add](pre + 'DOMContentLoaded', init, false);
      doc[add](pre + 'readystatechange', init, false);
      root[add](pre + 'load', init, false);
    }

  }


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


  /**
   * ----------------------------------------------------------------------
   * z.Class
   *
   * Based on John Resig's inheritance technique,
   * (see http://ejohn.org/blog/simple-javascript-inheritance/)
   * that was inspired by base2 and Prototype.
   * 
   * Modified a bit -- uses a diferent method (based on coffescript)
   * to avoid calling the constructor, with the intention to allow
   * the direct definition of the constructor.
   *
   * MIT Licensed.
   */
  var fnTest = /xyz/.test(function(){xyz;}) ? /\b__super__\b/ : /[\D|\d]*/;

  /**
   * The function used to actually extend classes.
   *   var Foo = z.Class({ ... });
   *   var Bar = Foo.extend({ ... });
   *
   * @param {Object} props
   * @return {Object}
   * @api private
   */
  var classExtend = function(props) {
    // The parent.
    var __super__ = this.prototype
      , parent = this
      // props["__new__"] will overwrite the constructor of the new class.
      , Class = (z.util.isFunction(props["__new__"]))? 
        (function(){
          var ret = props["__new__"];
          delete props["__new__"];
          return ret;
        })() :
        // Inherit the parent constructor.
        function(){
          parent.apply(this, arguments);
        }

    // Set up the prototype chain from the parent.
    // Use a surrogate so that we don't call the constructor.
    // (per backbone)
    var Surrogate = function(){ this.constructor = Class; }
    Surrogate.prototype = this.prototype;
    Class.prototype = new Surrogate;

    // Copy the properties over onto the new prototype
    for (var name in props) {
      // Check if we're overwriting an existing function in the parent and make sure
      // the method actually uses "__super__", otherwise don't bother creating a closure
      // with the "__super__" call.
      Class.prototype[name] = ( z.util.isFunction(props[name]) 
      && z.util.isFunction(__super__[name]) 
      && fnTest.test(props[name]) ) ?
        (function(name, fn){
          return function() {
            var tmp = this.__super__;
            this.__super__ = __super__[name];
            var ret = fn.apply(this, arguments);
            this.__super__ = tmp;

            return ret;
          };
        })(name, props[name]) :
        props[name];
    }

    // Make sure constructor is the one you expect.
    Class.prototype.constructor = Class;

    // Make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };

  /**
   * The default class constructor.
   */
  var classConstructor = function(){
    if(this.__init__){
      this.__init__.apply(this, arguments);
    }
  }
 
  /**
   * The Class API.
   * Creates a new class, or acts as an alternate way to extend a class.
   *   var Foo = z.Class({ ... });
   *   var Bar = z.Class(Bar, {...});
   * You can also use this function to extend generic objects or functions.
   *   var Foo = z.Class({...}, {...})
   *
   * @param {Object} parent (optional)
   * @param {Object} props
   * @return {Object}
   */
  z.Class = function(parent, props){
    if( z.util.isUndefined(props) ){
      props = parent;
      parent = false;
    }

    // The most common case, so try it first.
    if(!parent){
      return classExtend.call(classConstructor, props);
    }

    if(parent && hasOwnProperty.call(parent, 'extend')){
      return parent.extend(props);
    } else if (z.util.isFunction(parent)){
      // Use parent as constructor.
      return classExtend.call(parent, props);
    } else if(z.util.isObject(parent)){
      // Bind the default constructor to the object.
      parent.__new__ = classConstructor;
      return classExtend.call(parent, props);
    } else {
      // I guess they tried to pass a string or something crazy.
      throw new TypeError('{parent} must be a function, object or undefined.');
    }
  }

  // Expose Class to the root.
  root.Class = z.Class;


  /**
   * ----------------------------------------------------------------------
   * z.promise
   *
   * Copied wholsale from: https://github.com/dfilatov/vow/blob/master/lib/vow.js
   *
   * @author Filatov Dmitry <dfilatov@yandex-team.ru>
   * @version 0.4.1
   * @license
   * Dual licensed under the MIT and GPL licenses:
   *   * http://www.opensource.org/licenses/mit-license.php
   *   * http://www.gnu.org/licenses/gpl.html
   */

  (function(){ // keep promise in its own namespace.

  /**
   * z.Deffered is the primary API
   */
  z.Deffered = z.Class({
    
    __init__: function(){
      this._promise = new z.Promise();
    },

    /**
     * Return the promise.
     */
    promise: function(){
      return this._promise;
    },

    /**
     * Resolve the promise with the passed value.
     *
     * @param {Mixed} value
     */
    resolve: function(value){
      this._promise.isResolved() || this._promise._resolve(value);
    },

    /**
     * Reject the promise with the given reason.
     *
     * @param {Mixed} reason
     */
    reject: function(reason){
      this._promise.isResolved() || this._promise._reject(reason);
    },

    /**
     * Notify the promise with the given value.
     *
     * @param {Mixed} value
     */
    notify: function(value){
      this._promise.isResolved() || this._promise._notify(value);
    }

  });

  var PROMISE_STATUS = {
    PENDING   : 0,
    FULFILLED : 1,
    REJECTED  : -1
  };

  /**
   * The Promise class. No abilty to directly resolve or reject (use Deffered for that),
   * use if you just want someone to subscribe.
   */
  z.Promise = z.Class({

    __init__:  function(resolver){
      this._value = undefined;
      this._status = PROMISE_STATUS.PENDING;

      this._fulfilledCallbacks = [];
      this._rejectedCallbacks = [];
      this._progressCallbacks = [];

      if(z.util.isFunction(resolver)){
        var self = this
          , resolverFnLen = resolver.length;

        resolver(
          function(val){
            self.isResolved() || self._resolve(val);
          },
          resolverFnLen > 1?
            function(reason){
              self.isResolved() || self._reject(reason);
            } : undefined,
          resolverFnLen > 2?
            function(val){
              self.isResolved() || self._notify(val);
            } : undefined
        );
      }

    },

    /**
     * Return the current value.
     */
    valueOf : function(){
      return this._value;
    },

    isResolved: function(){
      return this._status !== PROMISE_STATUS.PENDING;
    },

    isFulfilled: function(){
      return this._status === PROMISE_STATUS.FULFILLED;
    },

    isRejected: function(){
      return this._status === PROMISE_STATUS.REJECTED;
    },

    /**
     * Add callbacks
     */
    then: function(onFulfilled, onRejected, onProgress, ctx){
      var defer = new z.Deffered();
      this._enqueue(defer, onFulfilled, onRejected, onProgress, ctx);
      return defer.promise();
    },

    /**
     * Shortcut for errors.
     */
    catches: function(onRejected, ctx){
      return this.then(undefined, onRejected, ctx);
    },

    /**
     * Alias for catches.
     */
    fail: function(onRejected, ctx){
      return this.catches(onRejected, ctx);
    },

    /**
     * Runs on both fulfillment and rejection.
     */
    always: function(onResolved, ctx){
      var self = this
        , cb = function(){
            return onResolved.call(this, self);
          }

      return this.then(cb, cb, ctx);
    },

    /**
     * Run whenever the state changes, regardless of the current status
     * of the promise.
     */
    progress: function(onProgress, ctx){
      return this.then(undefined, undefined, onProgress, ctx);
    },

    done: function(onFulfilled, onRejected, onProgress, ctx){
      this
        .then(onFulfilled, onRejected, onProgress, ctx)
        .catches(throwException);
    },

    _resolve: function(val){
      if(this._status !== PROMISE_STATUS.PENDING){
        return;
      }

      if(val === this){
        this._reject('Can\'t resolve promise with itself');
        return;
      }

      if(val instanceof z.Promise){
        val.then(
          this._resolve,
          this._reject,
          this._notify,
          this );
        return;
      }

      if(z.util.isObject(val) || z.util.isFunction(val)){
        var then;
        try{
          then = val.then;
        } catch(e) {
          this._reject(e);
          return;
        }

        if(z.util.isFunction(then)){
          var self = this
            , isResolved = false;

          try {
            then.call(
              val,
              function(val){
                if(isResolved){
                  return;
                }
                isResolved = true;
                self._resolve(val);
              },
              function(reason){
                if(isResolved){
                  return;
                }
                isResolved = true;
                self._reject(reason);
              },
              function(val){
                self._notify(val);
              }
            );
          } catch(e){
            isResolved || this._reject(e);
          }

          return;
        }
      }

      this._fulfill(val);
    },

    _fulfill: function(val){
      if(this.isResolved()){
        return;
      }

      this._status = PROMISE_STATUS.FULFILLED;
      this._value = val;

      this._dispatch(this._fulfilledCallbacks, val);
      this._fulfilledCallbacks = this._rejectedCallbacks = this._progressCallbacks = undefined;
    },

    _reject: function(reason){
      if(this.isResolved()){
        return;
      }

      this._status = PROMISE_STATUS.REJECTED;
      this._value = reason;

      this._dispatch(this._rejectedCallbacks, reason);
      this._fulfilledCallbacks = this._rejectedCallbacks = this._progressCallbacks = undefined;
    },

    _notify: function(val){
      this._dispatch(this._progressCallbacks, val);
    },

    _enqueue: function(defer, onFulfilled, onRejected, onProgress, ctx){
      if(onRejected && !z.util.isFunction(onRejected)){
        ctx = onRejected;
        onRejected = undefined;
      }
      if(onProgress && !z.util.isFunction(onProgress)){
        ctx = onProgress;
        onProgress = undefined;
      }

      var cb;

      if(!this.isRejected()){
        cb = { 
          defer: defer,
          fn: z.util.isFunction(onFulfilled)? onFulfilled : undefined,
          ctx: ctx
        };
        this.isFulfilled()? // Then trigger right away, otherwise push.
          this._dispatch([cb], this._value) :
          this._fulfilledCallbacks.push(cb);
      }

      if(!this.isFulfilled()){
        cb = {
          defer: defer,
          fn: onRejected,
          ctx: ctx
        };
        this.isRejected()?
          this._dispatch([cb], this._value) :
          this._rejectedCallbacks.push(cb);
      }

      if(this._status === PROMISE_STATUS.PENDING){
        this._progressCallbacks.push({
          defer: defer,
          fn: onProgress,
          ctx: ctx
        });
      }
    },

    _dispatch: function(callbacks, arg){
      var len = callbacks.length;

      if(!len){
        return;
      }

      var isResolved = this.isResolved()
        , isFulfilled = this.isFulfilled();

      nextTick(function(){
        var cb, defer, fn;

        z.util.each(callbacks, function(cb){
          defer = cb.defer;
          fn = cb.fn;

          if(fn){
            var ctx = cb.ctx
              , res;
            try {
              res = ctx? fn.call(ctx, arg) : fn(arg);
            } catch(e) {
              defer.reject(e);
              return;
            }

            isResolved?
              defer.resolve(res) :
              defer.notify(res);

          } else {

            isResolved?
              isFulfilled?
                defer.resolve(arg) :
                defer.reject(arg)  :
              defer.notify(arg);

          }

        });

      });

    }

  });

  /**
   * Coerce a value into a thenable.
   */
  z.Promise.cast = function(value){
    return (value instanceof z.Promise)? value : z.Promise.resolve(value);
  }

  z.Promise.when = function(value, onFulfilled, onRejected, onProgress, ctx){
    return z.Promise.cast(value).then(onFulfilled, onRejected, onProgress, ctx);
  }

  z.Promise.resolve = function(value){
    var res = new z.Deffered();
    res.resolve(value);
    return res.promise();
  }

  var nextTick = (function(){
    var fns = []
      , enqueueFn = function(fn){
          return fns.push(fn) === 1;
        }
      , dispatchFns = function(){
          var toCall = fns
            , i = 0
            , len = fns.length;
          fns = [];
          while(i < len){
            toCall[i++]();
          }
        };

    if(typeof setImmediate !== "undefined" && z.util.isFunction(setImmediate)){ // ie10, node < 0.10
      return function(fn) {
        enqueueFn(fn) && setImmediate(dispatchFns);
      };
    }

    if(typeof process === "object" && process.nextTick){ // node > 0.10
      return function(fn){
        enqueueFn(fn) && process.nextTick(dispatchFns);
      }
    }

    if(root.postMessage){ // modern browsers
      var isAsync = true;
      if(root.attachEvent){
        var checkAsync = function(){
          isAsync = false;
        }
        root.attachEvent('onmessage', checkAsync);
        root.postMessage('__checkAsync', '*');
        root.detachEvent('onmessage', checkAsync);
      }

      if(isAsync){
        var msg = "__promise" + new Date
          , onMessage = function(e){
              if(e.data === msg){
                e.stopPropagation && e.stopPropagation();
                dispatchFns();
              }
            };

        root.addEventListener?
          root.addEventListener('message', onMessage, true) :
          root.attachEvent('onmessage', onMessage);

        return function(fn){
          enqueueFn(fn) && root.postMessage(msg, '*');
        }

      }
    }

    return function(fn) { // old browsers.
      enqueueFn(fn) && setTimeout(dispatchFns, 0);
    };
  })(),
  throwException = function(e){
    nextTick(function(){
      throw e;
    })
  };

  })();


  /**
   * A simple iterator class.
   *
   * @package z.util
   */
  z.util.Iterator = z.Class({

    /**
     * Initilize.
     *
     * @param {Array} data An array of data to iterate over.
     */
    __init__:function(data){
      this.data = data || [];
      this.currentIndex = 0;
      this.length = this.data.length;
    },

    push: function(item){
      this.data.push(item);
      this.length = this.data.length;
      return this;
    },

    pop: function(item){
      this.data.pop(item);
      this.length = this.data.length;
      return this;
    },

    indexOf: function(item){
      return this.data.indexOf(item);
    },

    has: function(item){
      return this.indexOf(item);
    },

    atFirst: function(){
      return this.currentIndex === 0;
    },

    atLast: function(){
      return this.currentIndex >= (this.length -1);
    },

    at: function(position){
      return this.currentIndex === position;
    },
    
    next: function(){
      this.currentIndex++;
    },

    prev: function(){
      this.currentIndex--;
    },

    last: function(){
      this.currentIndex = (this.data.length - 1);
    },

    valid: function(){
      if(this.currentIndex < this.data.length
        && this.currentIndex >= 0){
        return true;
      }
      return false;
    },

    rewind: function(){
      this.currentIndex = 0;
    },

    current: function(){
      return this.data[this.currentIndex];
    },

    each: function(callback){
      if(typeof callback !== 'function'){
        return;
      }
      this.rewind();
      while(this.valid()){
        if(callback(this.current(), this)){
          break; // break when returns true.
        }
        this.next();
      }
      this.rewind();
    }

  });

  /**
   * OOP factory version.
   */
  z.util.prototype.iterator = function(){
    return new z.util.Iterator(this._obj);
  }


  /**
   * ----------------------------------------------------------------------
   * z.events
   *
   * Fit's event system.
   * Based heavily on backbone.
   */

  var eventsSeparator = /\s+/;

  /**
   * Handles space seperated events and event-maps
   *
   * @param {Object} obj
   * @param {String || Object} name Either pass an event-name, an
   *   event-map object (eg: {'foo': function(){code}, etc. } )
   *   or a space separated list of events (eg: 'foo bar baz')
   * @param {Function} callback
   * @param {Object} context
   * @return {Bool} True if the API is handling, false if the calling 
   *   function should handle.
   */
  var eventsApi = function(obj, action, name, rest){
    if(!name){
      return true;
    }

    if(typeof name === 'object'){
      for(var key in name){
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    if(eventsSeparator.test(name)){
      var names = name.split(eventsSeparator);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  }

  /**
   * Efficient events dispatcher (based on backbone)
   *
   */
  var eventsDispatcher = function(events, args){
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  }  

  /**
   * Handles binding and running of events.
   *
   * @package z.events
   * @api Private
   */
  var Events = z.Class({

    __init__: function(context){
      this._context = (context || this);
      this._listeningTo = {};
      this._listenerId = z.util.uniqueId('L')
      this._events = {};
    },

    on: function(name, callback, context){
      if(!eventsApi(this, 'on', name, [callback, context]) || !callback){
        return this;
      }
      var events = this._events[name] || (this._events[name] = []);
      events.push({
        name: name,
        callback: callback,
        context: context,
        ctx: (context || this._context)
      });
      return this;
    },

    once: function(name, callback, context){
      if(!eventsApi(this, 'once', name, [callback, context]) || !callback){
        return this;
      }
      var self = this
        , once = z.util.once(function(){
            self.off(name, once);
            callback.apply(this.arguments);
          })
        ;
      once._callback = callback;
      return this.on(name, once, context);
    },

    off: function(name, callback, context){
      if(!eventsApi(this, 'off', name, [callback, context])){
        return this;
      }
      if(!name && !callback && !context){
        // If no args, clear all events.
        this._events = {};
        return this;
      }

      // If {name} is not passed, go through all events and disable them
      // if they match {callback} or {context}.
      var names = name ? [name] : Object.keys(this._events)
        ;

      for(var i = 0; i < names.length; i++){
        var name = names[i]
          , events = this._events[name]
          , ev, retain
          ;

        if(events){
          this._events[name] = retain = [];

          if(callback || context){

            for(var j =0; j < events.length; j++){
              ev = events[j];

              if(
                (callback && callback !== ev.callback && callback !== callback._callback)
                || (context && context !== ev.context)
              ){
                retain.push(ev);
              }
            }
          }

          if (0 >= retain.length){
            delete this._events[name];
          }

        }
      }
    },

    listenTo: function(obj, name, callback){
      if(false === obj instanceof Events){
        throw new TypeError('{obj} must be instance of {Events}');
        return this;
      }
      this._listeningTo[obj._listenerId] = obj;
      if(!callback && typeof name === 'object'){
        callback = this._context;
      }
      obj.on(name, callback, this._context);
      return this;
    },

    stopListening: function(obj, name, callback, context){
      var listeningTo = this._listeningTo
        , remove
        ;

      if(!listeningTo){
        return this;
      }

      remove = !name && !callback;

      if(!callback && typeof name === 'object'){
        callback = this;
      }

      listeningTo = (obj)? (listeningTo={})[obj._listenerId] = obj : listeningTo;

      for(var id in listeningTo){
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if(remove || z.util.isEmpty(obj._events)){
          delete this._listeningTo[id];
        }
      }

    },

    trigger: function(name){
      if(!this._events){
        return this;
      }

      var args = slice.call(arguments, 1)
        , events, allEvents
        ;

      if(!eventsApi(this, 'trigger', name, args)){
        return this;
      }

      events = this._events[name];
      allEvents = this._events.all;

      if(events){
        eventsDispatcher(events, args);
      }
      if(allEvents){
        // The first argument of an 'all' event is always the
        // name of the triggered event.
        eventsDispatcher(allEvents, arguments);
      }

      return this;
    }

  });

  /**
   * Events API
   *
   * @return {Events}
   */
  z.events = function(context){
    return new Events(context);
  }



  /**
   * ----------------------------------------------------------------------
   * z.Scripts
   *
   * Fit's Script loader, which uses the DOM to get js files.
   */

  // TODO:
  // Add STATUS inline with other modules.
  // Try to add promises, which seem to break things for some reason.

  SCRIPTS_STATUS = {
    PENDING: 0,
    DONE: 1,
    FAILED: -1
  };

  /**
   * Scripts API
   */
  var Scripts = z.Scripts = {

    scriptSettings: {
      nodeType: 'text/javascript',
      charset: 'utf-8',
      async: true
    },

    currentlyAddingScript: null,
    interactiveScript: null,
    lastReq: null,

    pending: [],

    /**
     * Check if a file has been loaded from the passed url.
     *
     * @param {String} url
     * @return {Boolean}
     */
    isLoaded: function(url){
      var scripts = this.scripts()
        , wasLoaded = false
        ;

      z.util.each(scripts, function(item){
        if(item.getAttribute('data-from') === url){
          wasLoaded = true;
          return true;
        }
      });

      return wasLoaded;
    },

    /**
     * Check if a file with the requested url is loading.
     *
     * @param {String} url
     * @return {Boolean}
     */
    isPending: function(url){
      return this.pending.indexOf(url) >= 0;
    },

    /**
     * Create a script node.
     *
     * @param {Object} req
     * @param {Function} next
     * @param {Function} err
     * @returns {script}
     */
    load: function(req, next, err){

      var node = document.createElement('script')
        , head = document.getElementsByTagName('head')[0]
        , self = this
        , settings = this.scriptSettings
        , defaults = {
            url: ''
          }
        , events
        ;
        
      req = z.util.defaults(defaults, req);

      node.type = settings.nodeType || 'text/javascript';
      node.charset = settings.charset;
      node.async = settings.async;

      node.setAttribute('data-from', (req.from || req.url));

      this.pending.push(req.url);

      if(typeof next !== 'function'){
        next = function(){};
      }
      if(typeof err !== 'function'){
        err = function(req, e){
          throw new Error("Failed loading "+req.url);
        }
      }

      scriptLoadEvent(node, next, err);

      // For ie8, code may start running as soon as the node
      // is placed in the DOM, so we need to be ready:  
      this.currentlyAddingScript = node;
      head.appendChild(node);
      node.src = req.url;
      // Clear out the current script after DOM insertion.
      this.currentlyAddingScript = null;


      return node;

    },

    /**
     * Get all the scripts on the page.
     */
    scripts: function() {
      return document.getElementsByTagName('script');
    },

    // SPEND MORE TIME ON THIS
    // Not entirely sure when or why this is being used yet.
    // Targets ie9 <, but also seems to be called by IE10.
    getInteractiveScript: function(){
      if (this.interactiveScript && this.interactiveScript.readyState === 'interactive') {
        return interactiveScript;
      }

      z.util.eachReverse(this.scripts(), function (script) {
        if (script.readyState === 'interactive') {
          return (self.interactiveScript = script);
        }
      });
      return interactiveScript;
    }

  }

  /**
   * Configure the event listener.
   */
  var scriptLoadEvent = (function(){

    if(typeof document === "undefined"){
      // Return an empty function if this is a server context
      return function(node, next, err){ /* noop */ };
    }

    var testNode = document.createElement('script')
      , loader = null;

    // Test for support.
    // Test for attach event as IE9 has a subtle error where it does not 
    // fire its onload event right after script-load with addEventListener,
    // like most other browsers.
    // (based on requireJs)
    if (testNode.attachEvent){

      // Because onload is not fired right away, we can't add a define call to
      // anonymous modules. However, IE reports the script as being in 'interactive'
      // ready state at the time of the define call.
      loader = function(node, next, err){
        z.Scripts.useInteractive = true;
        node.attachEvent('onreadystatechange', function(){
          if(node.readyState === 'loaded'){
            next(node);
            z.Scripts.interactiveScript = null;
          }
        });
        // Error handler not possible I beleive.
      }

    } else {
      
      loader = function(node, next, err){
        node.addEventListener('load', function(e){
          next(node);
          z.Scripts.interactiveScript = null;
        }, false);
        node.addEventListener('error', function(e){
          err(e);
          z.Scripts.interactiveScript = null;
        }, false);
      }

    }

    return loader;

  })();


  /**
   * ----------------------------------------------------------------------
   * z.Ajax
   *
   * Fit's ajax wrapper
   */

  var AJAX_STATUS = {
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4
  };

  var HTTP_METHODS = [
    'GET',
    'PUT',
    'POST',
    'DELETE'
  ];

  var AJAX_DEFAULTS = {
    url: '',
    method: 'GET',
    data: false
  }

  /**
   * Ajax API
   */
  z.Ajax = {

    /**
     * Send an XMLHttpRequest
     *   
     *  z.Ajax.request({url:'my/api/01', method:'get'}, function(req, res){
     *    // req == the request you sent, res == the response.
     *  }, function(req, status){
     *    // If there was an error, this callback will be called.
     *  });
     *
     * @param {Object} callbacks Callbacks to run on script load.
     * @return {XMLHttpRequest}
     */ 
    request: function(req, next, err){
      var request
        , self = this
        , method = 'GET';

      req = z.util.defaults(AJAX_DEFAULTS, req);
      
      method = req.method.toUpperCase() === 'GET';

      if(HTTP_METHODS.indexOf(method) <= 0){
        // Ensure we have an allowed method.
        method = 'GET';
      }

      if(window.XMLHttpRequest){
        request = new XMLHttpRequest();
      } else { // code for IE6, IE5
        request = new ActiveXObject("Microsoft.XMLHTTP");
      }

      var promise = new z.Promise(function(res, rej){

        request.onreadystatechange = function(){
          if(self.isDone(this.readyState)){
            if(200 === this.status){
              if(this.response){
                res(this.response);
              } else {
                res(this.responseText);
              }
            } else {
              rej(this.status);
            }
          }
        }

      });

      if(z.util.isFunction(next)){
        promise.then(next);
      }
      if(z.util.isFunction(err)){
        promise.catches(err);
      } else {
        promise.catches(function(e){
          throw e;
        });
      }

      if(method === "GET" && req.data){
        req.url += '?' + this._buildQueryStr(req.data);
      }

      request.open(method, req.url, true);

      if(method === "POST" && req.data){
        var params = this._buildQueryStr(req.data)
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.send(params);
      } else {
        request.send();
      }

      return promise;
    },

    _buildQueryStr: function(data){
      var query = []
        ;
      for(var key in data){
        query.push(key + '=' + data[key]);
      }
      return query.join('&');
    },

    isDone: function(state){
      return state === AJAX_STATUS.DONE;
    }

  }


  /**
   * ----------------------------------------------------------------------
   * z.module
   *
   * z's module loading system.
   * Compatable with AMD.
   */

  /**
   * To do:
   * Circular dependencies will run forever.
   * At the very least, throw an error if this happens.
   */

  /**
   * Constants
   */
  var MODULE_GLOBAL_STATUS = {
    PENDING: 0,
    DONE: 1,
    REJECTED: -1
  };

  /**
   * The module manager.
   */
  z.Application = z.Class({

    config: {
      shim: {},
      alias: {}
    },

    __init__: function(config){

      this.config = z.util.defaults(this.config, config);

      this._modules = {};
      this._plugins = {};

      // The app is 'done' until modules are added to it.
      this._state = MODULE_GLOBAL_STATUS.DONE;
      this._tmp = null;

      // Make this the active app.
      this.bindApi();
    },

    setup: function(config){
      this.config = z.util.defaults(this.config, config);
    },

    /**
     * Checks all modules and loads any that need it.
     * This is run internally: Other then some testing instances,
     * you shoulding need to use it.
     */
    start: function(next){

      var self = this
        , pending = false;

      var promise = new z.Promise(function(res, rej){

        z.u(self._modules).each(function(mod){
          if( mod instanceof Module && mod.isPending() ){
            mod.enable(function(){
              self.start(res);
            }, rej);
            pending = true;
            return true; // break loop
          }
        });

        if(!pending){
          res();
        }

      });

      promise.done(next);

      return promise;
    },

    /**
     * Create a new module.
     *
     * @param {String} name (optional)
     * @return {Module}
     */
    add: function(name){
      
      this._state = MODULE_GLOBAL_STATUS.PENDING;

      if(typeof name === "undefined"){
        var node;
        if(z.Scripts.useInteractive){
          // For < IE9 (and 10, apparently -- seems to get called there too)
          // I think this is because <IE9 runs onload callbacks BEFORE the code
          // executes, while other browsers do it right after.
          node = z.Scripts.currentlyAddingScript || z.Scripts.getInteractiveScript();
          name = node.getAttribute('data-from');
        } else {
          // Assign to a temp cache, to be named by the onload callback.
          this._tmp = new Module();
          return this._tmp;
        }
      }

      if(this.has(name)){
        name = z.util.uniqueId(name);
      }

      this._modules[name] = new Module();
      return this._modules[name];

    },

    /**
     * Check if the module exists.
     *
     * @param {String} name
     */
    has: function(name){
      return this._modules.hasOwnProperty(name);
    },

    /**
     * Get a module's content from the registry.
     * Require methods/classes from the module by passing an array
     * as the second arg.
     *
     * @param {String} from
     * @param {String} uses
     * @throws {Error} If the module does not exist in the registry this will
     *   throw an error. Check z.module.has(moduleName) before calling this
     *   method.
     * @return {Object || false} Returns false if the module is not enabled.
     */
    get: function(from, uses){
      var mod
        , context = {};

      if(false === this.has(from)){
        throw new Error('Module '+from+' does not exist in the registry.');
        return false;
      }

      if('*' === uses){
        uses = false;
      }

      if(uses && false === uses instanceof Array){
        uses = [uses];
      }

      mod = this._modules[from];

      if(!mod.isEnabled()){
        return false;
      }

      if(uses instanceof Array
        && uses.indexOf('*') < 0){
        z.util.each(uses, function(item){
          if(mod.definition.hasOwnProperty(item)){
            context[item] = mod.definition[item];
          }
        });
        return context;
      }

      context[from.split('.').pop()] = mod.definition;
      return context;
    },

    /**
     * Parse a dot-seperated name into a URL.
     *
     * @param {Object} req
     */
    findUrl: function(req){
      var shim = this.config.shim
        , alias = this.config.alias
        , name = req.from
        , ext = req.type
        , nameParts = name.split('.')
        , changed = false
        , src = ''
        ;

      ext = (ext || 'js');

      z.util.each(nameParts, function(part, index){
        if(alias.hasOwnProperty(part)){
          nameParts[index] = alias[part];
        }
      });

      name = nameParts.join('.');
      if(shim.hasOwnProperty(name)){
        src = shim[name].src;
      } else {
        src = name.replace(/\./g, '/');
        src = z.config.module.root + src + '.' + ext;
      }

      return src;
    },

    /**
     * Bind global imports, exports and define to this instance
     * of z.Application
     */
    bindApi: function(){
      var self = this;
      root.define = function(){
        return self._amdDefine.apply(self, arguments);
      }
      // Confirm that this is AMD complient, per specs
      // see: https://github.com/amdjs/amdjs-api/wiki/AMD
      root.define.amd = {
        jQuery: true 
      };
      root.imports = function(){
        return self._apiImports.apply(self, arguments);
      }
      root.exports = function(cb){
        return self._apiExports(cb);
      }
    },

    isPending: function(){
      return this._state === MODULE_GLOBAL_STATUS.PENDING;
    },

    isDone: function(){
      return this._state !== MODULE_GLOBAL_STATUS.PENDING;
    },

    isRejected: function() {
      return this._state === MODULE_GLOBAL_STATUS.REJECTED;
    },

    /**
     * Plugins for z's loader.
     * Plugins are wrapped in a promise, which passes its resolver
     * and rejector functions as arguments (by convention, 'res' and 'rej').
     *
     * @param {String} name
     * @param {Function} cb
     */
    plugin: function(name, cb){
      this._plugins[name] = function(mod, req, next, err){

        var promise = new z.Promise(function(res, rej){
          cb.call(mod, req, res, rej);
        });
        
        if(z.util.isFunction(next)){
          promise.then(next);
        }

        if(z.util.isFunction(err)){
          promise.catches(err);
        }

        return promise;
      }
    },

    _usePlugin: function(name){
      if(this._plugins.hasOwnProperty(name)){
        return this._plugins[name];
      }

      this._state = MODULE_GLOBAL_STATUS.REJECTED;
      throw new Error('Plugin was not found: '+name);
      return false;
    },

    /**
     * Ensure that a module is nammed.
     *
     * @param {String} name
     */
    _ensureModule: function(name){
      var tmp = this._tmp;
      if(null === tmp){
        return;
      }
      this._tmp = null;
      if(!tmp instanceof Module){
        return;
      }
      this._modules[name] = tmp;
      return;
    },

    /**
     * Investigate the state of the app and set the current state.
     */
    _checkState: function(){
      var self = this
        , done = true;
      if(this.isRejected()){
        // Can't transition out of a rejected state.
        return;
      }
      z.util.each(this._modules, function(mod){
        if(!mod.isDone()){
          self._state = MODULE_GLOBAL_STATUS.PENDING;
          done = false;
          return true;
        }
        if(mod.isRejected()){
          self._state = MODULE_GLOBAL_STATUS.REJECTED;
          done = false;
          return true;
        }
      });
      if(done){
        this._state = MODULE_GLOBAL_STATUS.DONE;
      }
    },

    /**
     * Wrapper to allow z modules to work with AMD style requires.
     * (don't call directly: bound with 'z.Application#bindApi' 
     * and available in the global scope as 'define')
     *
     * @package z.module
     * @param {String} name (optional)
     * @param {Array} reqs
     * @param {Function} factory
     * @return {Undefined}
     */
    _amdDefine: function(name, reqs, factory){

      if(2 === arguments.length){
        factory = reqs;
        reqs = name;
        name = undefined;
      }

      if(1 === arguments.length){
        factory = name;
        reqs = [];
        name = undefined;
      }

      var mod = this.add(name);

      z.util.each(reqs, function(req){
        mod.imports(req.split('/').join('.'));
      });

      mod.exports(function(__){
        var args = [];
        for(var dep in __){
          args.push(__[dep]);
        }

        var noConflictExports = root.exports // save the exports func.
          , noConflictModule = root.module
          , result;

        root.exports = {}; // Allows the use of exports.
        root.module = {}; // Allows the use of module.exports
        result = factory.apply(this, args);

        if(false === z.util.isEmpty(root.exports)){
          result = root.exports;
        }

        if(root.module.exports){
          result = root.module.exports;
        }

        root.exports = noConflictExports;
        root.module = noConflictModule;

        return result;
      });
    },

    /**
     * Shortcut to define modules without naming them first.
     * (don't call directly: bound with 'z.Application#bindApi' 
     * and available in the global scope as 'imports')
     *
     *  imports('app.module')
     *  .exports(function(__){ 
     *    console.log(__.hasOwnProperty('module')); // true 
     *  });
     *
     * @returns {Module}
     */
    _apiImports: function(){
      var mod = this.add();
      return Module.prototype.imports.apply(mod, arguments);
    },

    /**
     * Shortcut to define modules without any imports.
     * (don't call directly: bound with 'z.Application#bindApi' 
     * and available in the global scope as 'exports')
     *
     *  exports(function(){ 
     *    return{ 
     *      myModule = function(){ ... }
     *    }
     *  });
     *
     * @returns {Module}
     */
    _apiExports: function(cb){
      return this.add().exports(cb);
    }

  });

  /**
   * Constants
   */
  var MODULE_STATUS = {
    PENDING: 0,
    ENABLED: 1,
    IMPORTING: 2,
    DEFINED: 3,
    REJECTED: -1
  };

  /**
   * Modules are wrappers around each module that handle
   * dependencies, callbacks, and so forth.
   *
   * Create using z.Application#add(name) rather then calling directly.
   *
   * @api private
   */
  var Module = z.Class({

    /**
     * Set up instance variables.
     *
     * @return {Undefined}
     */
    __init__: function(){
      // Module#definition is where the completed module will be placed 
      // after all dependencies are loaded.
      this.definition = null;
      // Module#factory is where the factory callback is saved before 
      // dependencies are loaded.
      this.factory = null;
      // Module#deps is an iterator of required modules.
      this.deps = new z.util.Iterator;
      // Module#compiled is used by Module#compiles. If present, this will be
      // used when '$ z together' is run instead of Module#definition to create
      // a module WITHOUT dependencies. Use this only if you are creating a module
      // that can compile to a stand-alone script (such as with z.Plus)
      this.compiled = false;

      this._state = MODULE_STATUS.PENDING;
    },

    /**
     * Import items from an external module.
     *
     * @param {String || Object} from Items to import
     * @return {Object}
     */
    imports: function(from){
      
      var self = this
        , dep = {}
        ;

      if(arguments.length >= 2){
        for(var i=0; i < arguments.length; i++){
          this.imports(arguments[i]);
        }
        return this;
      }

      if(typeof from === 'object'){
        if(!from.hasOwnProperty('as')){
          from.as = 'script';
        }
        if('*' === from.uses || undefined === from.uses){
          from.uses = false;
        }
        if(false === from.uses instanceof Array && false !== from.uses){
          from.uses = [from.uses];
        }
        dep = from;
      } else {
        dep = {
          from: from,
          uses: false,
          as: 'script'
        }
      }

      // Get the url
      dep.url = (dep.url || z.App.findUrl(dep));

      this.deps.push(dep);

      return this;

    },

    /**
     * Define the module by passing a callback.
     * The object passed to the callback will contain
     * the requested dependecies. You can name this argument
     * anything you desire, but convetionally it is
     * named '__', a double-underscore (or 'DUS' for short). 
     * Example:
     *  z.module('mymodule')
     *  .imports({from:'app.Foo', uses:'*'})
     *  .exports(function(__){
     *     console.log(__.hasOwnProperty('Foo')); // true 
     *  });
     * 
     * @param {Function} factory
     * @return {this}
     */
    exports: function(factory){

      var self = this
        ;

      if(typeof factory === 'function'){
        this.factory = factory;
      } else {
        this.factory = function(){
          return factory;
        }
      }

      if(z.config.module.env === 'browser'
        && !z.App.isPending() ){
        z.App.start();
      }

      return this;
    },

    /**
     * Enable the module.
     * Module#enable can be used to resolve a promise, if so desired.
     *
     * @param {Function} next
     * @return {this}
     */
    enable: function(res, rej){

      var self = this
        , stop = false;

      if(!res){
        res = function(){}
      }
      if(!rej){
        rej = function(e){ throw new Error(e); }
      }

      if(self.isRejected()){
        rej('Cannot enable a rejected module');
        return;
      }

      if(self.isDone()){ // can only change from a pending state.
        res();
        return;
      }

      self._checkState();

      if(self.isPending()){
        self._import(res, rej);
        return;
      }

      self._define(res, rej);

      return this;

    },

    /**
     * Create a stand-alone script when compiling modules together.
     *  exports(function(__){
     *    return {
     *      foo: 'foo',
     *      bar: 'bar'
     *    };
     *  }).compiles(function(module){
     *    return module.foo;
     *  });
     *
     * @param {Function} factory A function to create the compiled module.
     *   The first arg is the module definition.
     */
    compiles: function(factory){
      if(typeof factory !== 'function'){
        return;
      }

      this.compiled = function(){
        return factory(this.definition);
      }
    },

    isPending: function(){
      return this._state === MODULE_STATUS.PENDING;
    },

    isEnabled: function(){
      return this._state === MODULE_STATUS.ENABLED;
    },

    isRejected: function(){
      return this._state === MODULE_STATUS.REJECTED;
    },

    isDefined: function(){
      return this._state === MODULE_STATUS.DEFINED;
    },

    isImporting: function(){
      return this._state === MODULE_STATUS.IMPORTING;
    },

    isDone: function(){
      return (this._state === MODULE_STATUS.ENABLED || this._state === MODULE_STATUS.REJECTED);
    },

    /**
     * Check to make sure all deps are loaded.
     */
    _checkState: function(){
      if(this.isDone() || this.isImporting()){
        return;
      }
      var done = true;
      this.deps.each(function(item){
        if(false === z.module.has(item.from)){
          this._state = MODULE_STATUS.PENDING;
          done = false;
          return true // no need to check every one
        }
      });
      if(done){
        this._state === MODULE_STATUS.ENABLED;
      }
    },

    /**
     * Load dependencies.
     *
     * @param {Function} res Resolver for the calling promise
     * @param {Function} rej Rejector for the calling promise
     * @api private
     */
    _import: function(res, rej){
      var self = this
        , queue = [];

      this._state = MODULE_STATUS.IMPORTING;

      this.deps.each(function(item){
        if(false === z.App.has(item.from)){
          queue.push(item);
        }
      });

      var len = queue.length
        , remaining = len;

      if(len > 0){
        z.util.each(queue, function(item, index){

          try{
            var as = (item.as || 'script')
              , loader = z.App._usePlugin(as);

            loader(self, item)
            .then(function(response){
              remaining -= 1;
              if(remaining <=0 ){
                self._state = MODULE_STATUS.DEFINED;
                self.enable(res, rej)
              }
            })
            .catches(rej);

          } catch(e) {
            // If a plugin is not found, an error will be thrown.
            self._state = MODULE_STATUS.REJECTED;
            rej(e);
          }

        });
      } else {
        self._state = MODULE_STATUS.DEFINED;
        this.enable(res, rej);
      }

    },

    /**
     * Run the factory.
     *
     * @param {Function} res Resolver for the calling promise
     * @param {Function} rej Rejector for the calling promise
     * @api private
     */
    _define: function(res, rej){

      var self = this
        , stop = false
        , context = {};

      // Make sure each of the deps has been enabled. If any need to be enabled, stop loading and
      // enable them.
      this.deps.each(function(dep){
        var current = z.App.get(dep.from, dep.uses);

        if(false === current){

          z.App._modules[dep.from].enable(function(){
            self.enable(res, rej);
          }, rej);

          stop = true;
          return true;
        }

        for(var key in current){
          context[key] = current[key];
        }

      });

      if(true === stop){
        return;
      }

      try {
        if(z.config.env !== 'server'){
          if(typeof this.factory === 'function'){
            this.definition = this.factory(context);
          } else {
            this.definition = this.factory;
          }
        } else {
          // If we're in a node.js env we don't want to execute the factory.
          // However, if the defintion is null z.module.start() will stall,
          // so we need to set it to 'true'
          this.definition = true;
        }
      } catch(e) {
        self._state = MODULE_STATUS.REJECTED;
        rej(e);
        return;
      }

      this._state = MODULE_STATUS.ENABLED;
      res();

      return;
    }

  });

  /**
   * Module API
   */

  /**
   * The app instance.
   */
  z.App = new z.Application(z.config.module);

  /**
   * Create a new, nammed module.
   *   
   * @param {String} classname A period delimited name for the module.
   *   If left blank, the last used request will name the module 
   *   (simmilar to how AMD works).
   * @return {Module}
   * @package z.module
   */
  z.module = function(moduleName){
    return z.App.add(moduleName);
  }

  /**
   * alias for z.App.start
   *
   * @return {z.Promise}
   */
  z.module.start = function(next){
    return z.App.start(next);
  }

  /**
   * Alias for z.App.setup
   *
   * @param {Object} config
   */
  z.module.setup = function(config){
    z.App.setup(config);
  }
  
  /**
   * Checks if a module has been loaded.
   *
   * @param {String} moduleName
   * @return {Boolean}
   */
  z.module.has = function(moduleName){
    return z.App.has(moduleName);
  }

  /**
   * Get items from a module.
   */
  z.module.get = function(from, uses){
    return z.App.get(from, uses);
  }

  /**
   * Find a URL from a z request.
   */
  z.module.findUrl = function(req){
    return z.App.findUrl(req);
  }

  /**
   * Plugins for z's loader.
   *
   * @param {String} name
   * @param {Function} cb
   */
  z.module.plugin = function(name, cb){
    z.App.plugin(name, cb);
  }

  /**
   * The default plugin, used for loading js files.
   */
  z.module.plugin('script', function(req, res, rej){
    var name = req.from
      , self = this;

    if(z.Scripts.isPending(req.url)){
      return;
    }

    z.Scripts.load(req, function(node){
      z.App._ensureModule(name);
      res();
    }, function(reason){
      rej('Could not load script ' + name);
    });
  });

  /**
   * Load other files.
   */
  z.module.plugin('file', function(req, res, rej){
    var name = req.from
      , self = this
      , mod = z.module(name); // The module that will wrap the file.
    req.method = 'GET';
    z.Ajax.request(req)
    .then(function(data){
      mod.exports(function(){ return data; });
      res();
    })
    .catches(rej);
  });



  if(typeof window !== "undefined"){  
    // Get the current script
    var executingScript = document.getElementsByTagName('script')[0]
    // Get a script to load from the DOM (set using data-load="script")
      , scriptToLoad = executingScript.getAttribute('data-load')
      ;

    // Start z once the DOM is ready.
    z.boot(function(e){

      if(null !== scriptToLoad && scriptToLoad.length > 0){ // getAttribute can return null OR empty string
        var scriptRootParts = scriptToLoad.replace(/\./, '/').split('/')
          , alias = (scriptRootParts.length >=1)? scriptRootParts.pop() : scriptToLoad
          , scriptRoot = ""
          ;

        if(scriptRootParts.length > 0){
          // Set the root based on the included file.
          // For example, including 'scripts/main' will result in 'scripts/' being the root.
          scriptRoot = scriptRootParts.join('/') + '/';
          z.config.module.root = scriptRoot;
        }

        // Ensure the requested script is loaded.
        var req = {from: alias};
        req.url = z.module.findUrl(req);
        z.Scripts.load(req, function(req, res){
          z.module.start();
        });

        return;
      }

      // Start collecting and defining modules.
      z.module.start();
    });
  }

}));