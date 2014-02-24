

/**
 * zjs 0.1.1
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: 2014-02-24T17:12Z
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


/**
 * ----------------------------------------------------------------------
 * z API
 */

/**
 * The top-level API for z
 *
 * @param {String | Function} name The module name. If this is the only arg given,
 *   and the name exists in the registry, this will return an existing module.
 *   If you pass a function here, you will define a ananymous module with no deps.
 * @param {Function} factory Pass a function here to quickly define a module
 *   with no deps.
 */
var z = root.z = function(name, factory){
  if(z.has(name) && !factory){
    return z.modules[name];
  }
  if(u.isFunction(name)){
    factory = name;
    name = undef;
  }
  var mod = _addModule(name);
  if(factory){
    mod.exports(factory);
  }
  return mod;
}

/**
 * Helper for adding modules.
 *
 * @param {String} name
 * @return {Module}
 * @api private
 */
var _addModule = function(name){
  if(typeof name === "undefined"){
    var node;
    if(Script.useInteractive){
      // For < IE9 (and 10, apparently -- seems to get called there too)
      // I think this is because <IE9 runs onload callbacks BEFORE the code
      // executes, while other browsers do it right after.
      node = Script.currentlyAddingScript || Script.getInteractiveScript();
      name = node.getAttribute('data-from');
    } else {
      // Assign to a temp cache, to be named by the onload callback.
      _tmpModule = new Module();
      return _tmpModule;
    }
  }

  z.modules[name] = new Module();
  return z.modules[name];
}

/**
 * Anonymous modules are stored here until they can be named.
 *
 * @var {Module | null}
 * @api private
 */
var _tmpModule = null;

/**
 * All modules are registered here.
 *
 * @var {Object}
 */
z.modules = {};

/**
 * Check to see if a module exists in the registry.
 *
 * @param {String} name
 */
z.has = function(name){
  return z.modules.hasOwnProperty(name);
}

/**
 * This method checks _tmpModule and assigns the name provided
 * if it finds a module there. Should be called by plugins in
 * their onLoad callbacks.
 *
 * @param {String} name
 */
z.ensureModule = function(name){
  var tmp = _tmpModule;
  if(null === tmp){
    return;
  }
  _tmpModule = null;
  if(!tmp instanceof Module){
    return;
  }
  z.modules[name] = tmp;
  return;
}

/**
 * The app configuration.
 *
 * @var {Object}
 */
z.config = {
  root: '',
  shim: {},
  alias: {},
  env: 'browser'
};

/**
 * Configure z
 *
 * @param {Object} options
 */
z.setup = function(options){
  z.config = u.defaults(z.config, options);
}

/**
 * Expose util funcs.
 */
z.u = z.util = u;

/**
 * The plugin registry.
 *
 * @var {Object}
 */
z.plugins = {};

/**
 * Plugable factory. If the only arg provided is [name], and
 * a plugin of that name exists, this will return a plugin.
 *
 * @param {String} name Set or get a plugin of this name.
 * @param {Loader} loader The loader class to use.
 * @param {Function} loadEvent The event to trigger on load
 * @param {Object} options
 * @throws {Error} If no plugin of the requested name is found.
 * @return {Plugable}
 */
z.plugin = function(name, loader, loadEvent, options){
  if(arguments.length <= 1){
    if(z.plugins.hasOwnProperty(name)){
      return z.plugins[name];
    }
    throw new Error('Plugin was not found: '+name);
    return false;
  }

  z.plugins[name] = new Plugable(loader, loadEvent, options);
  return z.plugins[name];
}

/**
 * Load a script.
 *
 * @param {Object} req
 * @param {Function} next
 * @param {Function} err
 * @return {Script}
 */
z.script = function(req, next, error){
  var s = new Script(req, z.config.script);
  s.done(next, error);
  return s;
}

/**
 * Send an AJAX request.
 *
 * @param {Object} req
 * @param {Function} next
 * @param {Function} err
 * @retrun {Ajax}
 */
z.ajax = function(req, next, err){
  var a = new Ajax(req, z.config.ajax);
  a.done(next, err);
  return a;
}

/**
 * Shortcut for anon modules. Same as calling z().imports.
 *
 * @param {String} from
 * @param {String | Array} uses (optional)
 * @param {Object} options (optional)
 * @return {Module}
 */
root.imports = function(from, uses, options){
  return z().imports(from, uses, options);
}


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
var _classExtend = function(props) {
  // The parent.
  var __super__ = this.prototype
    , parent = this
    // props["__new__"] will overwrite the constructor of the new class.
    , Class = (u.isFunction(props["__new__"]))? 
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
    Class.prototype[name] = ( u.isFunction(props[name]) 
    && u.isFunction(__super__[name]) 
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
var _classConstructor = function(){
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
  if(!props){
    props = parent;
    parent = false;
  }

  // The most common case, so try it first.
  if(!parent){
    return _classExtend.call(_classConstructor, props);
  }

  if(parent && hasOwnProperty.call(parent, 'extend')){
    return parent.extend(props);
  } else if (z.util.isFunction(parent)){
    // Use parent as constructor.
    return _classExtend.call(parent, props);
  } else if(z.util.isObject(parent)){
    // Bind the default constructor to the object.
    parent.__new__ = _classConstructor;
    return _classExtend.call(parent, props);
  } else {
    // I guess they tried to pass a string or something crazy.
    throw new TypeError('{parent} must be a function, object or undefined.');
  }
}


/**
 * ----------------------------------------------------------------------
 * z.Module
 *
 * The core of z.
 * 
 * This class will never be called directly -- instead, use z's constructor to
 * add and retrieve modules.
 *
 * @example:
 *
 *  z('foo.bar').
 *  imports('foo.bin', ['Bar @ Foo', 'Bin']).
 *  imports('foo.baz', 'Bar').
 *  exports(function(__){
 *    // code
 *  });
 */

var MODULE_STATE = {
  PENDING: 0,
  LOADED: 1,
  ENABLED: 2,
  FAILED: -1
};

/**
 * The module constructor.
 *
 * @param {Array} deps This arg is only used by the zjs optimizer.
 */
var Module = function(deps){
  this._deps = (deps && u.isArray(deps))? deps : [];
  this._state = MODULE_STATE.PENDING;
  this._factory = null;
  this._definition = null;
  this._onReady = [];
  this._onFailed = [];
}

/**
 * Regexp to parse aliases.
 *
 * @var {RegExp}
 * @api private
 */
var _alias = /\s?([\S]+?)\s?\@\s?([\S]+?)\s?$/;

/**
 * Check the module's definition and return requested item(s)
 *
 * @param {String | Array} items An item or items that you want from this module.
 *   Passing a string will always return a single item, an array returns an object.
 *   You can alias items with '@'. For example:
 *     z('myModule').get(['foo @ bar', 'baz']);
 *   This will return an object where 'bar' will alias 'foo'. Note that if you
 *   pass a string the alias will be ignored.
 * @return {Object | Mixed}
 */
Module.prototype.use = function(items){
  if(!this.isEnabled()){
    return false;
  }

  var self = this
    , single = false
    , ctx = {};

  if(!items){
    return this._definition;
  }

  if(!u.isArray(items)){
    single = true;
    items = [items];
  }

  u.each(items, function(item){
    var alias = item
      , name = item;
    if(_alias.test(item)){
      item.replace(_alias, function(match, actual, replace, index){
        name = actual;
        alias = replace;
        return match;
      });
    }
    if(self._definition.hasOwnProperty(name)){
      if(single){
        ctx = self._definition[name];
      } else {
        ctx[alias] = self._definition[name];
      }
    }
  });

  return ctx;
}

/**
 * Import modules.
 *
 * @param {String} from The name of a module, using period-delimited
 *   syntax. A loader will map this name to an url later. If this is the
 *   only arg provided (or [uses] indicates you want the entire module:
 *   see below) this module will be available, by default, using the last
 *   segment of the name.
 *      imports('foo.bar') ... -> imports as 'bar'
 *   Alternately, you can alias the name with '@'.
 *      imports('foo.bar @foo') ... -> imports as 'foo'
 *   If [uses] is defined, then the alias will be ignored.
 * @param {String | Array | Boolean} uses Specific item or items you want
 *   from the module. 
 *      imports('foo.bar', 'Bin') ... -> imports Bin from foo.bar
 *      imports('foo.bar', ['Bin', 'Ban']) ... -> imports Bin and Ban from foo.bar.
 *   Passing '*', 'false' or leaving this arg undefined will return the entire module.
 *      imports('foo.bar', '*') ... -> imports as 'bar' 
 *   Items requested here can be also be aliased using '@'.
 *      imports('foo.bar', ['Bin @ foo', 'Ban']) ... -> imports Bin (as 'foo') and Ban from foo.bar.
 * @param {Object} options Allows you to further modify the import request. A common
 *    example will be to use a plugin.
 *      imports('foo.bar', '*', {type:'ajax', ext:'txt'}) ... -> Import a txt file
 * @return {this}
 */
Module.prototype.imports = function(from, uses, options){
  if(!from){
    throw new TypeError('{from} must be defined');
  }

  var alias = false;
  if(_alias.test(from)){
    var ret = from;
    ret.replace(_alias, function(match, actual, replace){
      from = actual.trim();
      alias = replace.trim();
    });
  }

  uses = (!uses || '*' === uses)? false : (!u.isArray(uses))? [uses] : uses;
  options = u.defaults({type:'script'}, options);

  var dep = {
    from:from,
    alias:alias,
    uses:uses,
    options:options
  };

  this._deps.push(dep);

  return this;
}

/**
 * Define module exports.
 *
 * @param {String} name (optional) If a name is passed, then [factory]
 *   will define [name] in the module definition.
 * @param {Function} factory A callback to define the module (or
 *   module component, if [name] is passed).
 * @example:
 *   TODO
 * @return {this}
 */
Module.prototype.exports = function(name, factory){
  if(arguments.length <= 1){
    factory = name;
    name = false;
  }

  var self = this;

  if(!name){
    this._factory = factory;
  } else {
    if(null === this._factory) this._factory = {};
    this._factory[name] = factory;
  }

  setTimeout(function(){
    _resolve(self);
  }, 0); // Make sure all exports are defined first.

  return this;
}

/**
 * Enable the module.
 *
 * @param {Function} next (optional)
 * @parma {Function} error (optional)
 */
Module.prototype.enable = function(next, error){
  this.done(next, error);
  _resolve(this);
  return this;
}

/**
 * Callbacks to fire once the module has loaded all dependencies. 
 * If called on a enabled module, the callback will be fired immediately.
 *
 * @param {Function} onReady
 * @param {Function} onFailed
 */
Module.prototype.done = function(onReady, onFailed){
  if(onReady && u.isFunction(onReady)){
    (this.isEnabled())?
      onReady.call(this) :
      this._onReady.push(onReady);
  }
  if(onFailed && u.isFunction(onFailed)){
    (this.isFailed())?
      onFailed.call(this):
      this._onFailed.push(onFailed);
  }
  return this;
}

/**
 * Shortcut for Module#done(undefined, onFailed)
 *
 * @param {Function} onFailed
 */
Module.prototype.fail = function(onFailed){
  return this.done(undef, onFailed);
}

u.each(['Enabled', 'Loaded', 'Pending', 'Failed'], function(state){
  Module.prototype['is' + state] = function(){
    return this._state === MODULE_STATE[state.toUpperCase()];
  } 
});

/**
 * Helper to dispatch a function queue.
 *
 * @param {Array} fns
 * @param {Object} ctx
 */
var _dispatch = function(fns, ctx){
  u.each(fns, function(fn){
    fn.call(ctx);
  });
}

/**
 * Resolve a module
 *
 * @param {Module} mod
 * @param {MODULE_STATE} state (optional)
 */
var _resolve = function(mod, state){
  if(state){
    mod._state = state
  }

  if(mod.isPending()){
    _import(mod);
    return;
  }

  if(mod.isLoaded()){
    _define(mod);
    return;
  }

  if(mod.isFailed()){
    // dispatch the failed queue.
    _dispatch(mod._onFailed, mod);
    mod._onFailed = [];
    return;
  }

  if(mod.isEnabled()){
    // Dispatch the done queue.
    _dispatch(mod._onReady, mod);
    mod._onReady = [];
  }
}

/**
 * Import a module's deps.
 *
 * @param {Module} mod
 */
var _import = function(mod){
  var queue = [];

  u.each(mod._deps, function(item){
    if(false === z.has(item.from)){
      queue.push(item);
    }
  });

  var remaining = queue.length;

  if(remaining > 0){
    
    u.each(queue, function(item, index){
      var type = (item.options.type || 'script')
        , loader;

      try {
        loader = z.plugin(type);
      } catch(e) {
        // If a plugin is not found, an error will be thrown.
        _resolve(mod, MODULE_STATE.FAILED);
        throw e;
      }

      loader.load(item, function(){
        remaining -= 1;
        if(remaining <=0 ){
          _resolve(mod, MODULE_STATE.LOADED);
        }
      }, function(e){
        _resolve(mod, MODULE_STATE.FAILED);
        throw e;
      });

    });
  } else {
    _resolve(mod, MODULE_STATE.LOADED);
  }
}

/**
 * Define a module (that is, run its factory)
 *
 * @param {Module} mod
 */
var _define = function(mod){
  var stop = false
    , context = {};

  // Make sure u.each of the deps has been enabled. If any need to be enabled, stop loading and
  // enable them.
  u.each(mod._deps, function(dep){

    if(!z.has(dep)){
      // error
    }

    var current = z(dep.from)
      , parts = {};

    if(current.isFailed()){
      _resolve(mod, MODULE_STATE.FAILED);
      throw new Error('A depenency failed: '+current);
      stop = true;
      return true;
    }

    if(!current.isEnabled()){
      current.enable().done(function(){
        mod.enable();
      });
      stop = true;
      return true;
    }

    if(dep.uses){
      parts = current.use(dep.uses);
    } else {
      if(dep.alias){
        parts[dep.alias] = current._definition;
      } else {
        parts[dep.from.split('.').pop()] = current._definition;
      }
    }

    context = u.extend(context, parts);
  });

  if(true === stop){
    return;
  }

  try {
    if(z.config.env !== 'server'){
      if(u.isFunction(mod._factory)){
        mod._definition = mod._factory(context);
      } else if(u.isObject(mod._factory)) {
        mod._definition = {};
        u.each(mod._factory, function(item, key){
          if(u.isFunction(item)){
            mod._definition[key] = item(context)
          } else {
            mod._definition[key] = item;
          }
        })
      } else {
        mod._definition = mod._factory;
      }
    } else {
      // If we're in a node.js env we don't want to execute the factory.
      // However, if the defintion is null z.module.start() will stall,
      // so we need to set it to 'true'
      mod._definition = true;
    }
  } catch(e) {
    _resolve(mod, MODULE_STATE.FAILED);
    throw e;
    return;
  }
  _resolve(mod, MODULE_STATE.ENABLED);
}


/**
 * ----------------------------------------------------------------------
 * Plugable
 *
 * A wrapper for z plugins. Primarily ensures items are not loaded more then once.
 * This particular system is highly unstable -- I think there are much better
 * ways of making this user friendly, so it will likely change a lot.
 * For now, just use the provided 'script' and 'ajax' plugins.
 */

/**
 * Plugable is used by z.plugin to handle loading events.
 *
 * @param {Loader} loader A loader class. Requires a 'load' method
 *   and a 'done' method. See z.Loader for an example of how to
 *   create a compatable class.
 * @param {Function} loadEvent The callback that will be triggered
 *   when the module is loaded.
 * @param {Object} options Default options for requests.
 */
var Plugable = function(loader, loadEvent, options){
  this._queue = {};
  this._loader = loader;
  this.options = u.defaults(this.options, options);
  this._loadEvent = loadEvent;
}

/**
 * The default options for a request.
 * Currently, you can set 'ext' to change the default extension,
 * and 'req' to modifiy all request objects.
 *
 * This is subject to change!
 *
 * @var {Object}
 */
Plugable.prototype.options = {
  ext: 'js'
};

/**
 * Create an URL using this plugables options.
 *
 * @param {Object} request
 * @api private
 */
Plugable.prototype._makeUrl = function(req){
  var shim = z.config.shim
    , alias = z.config.alias
    , name = req.from
    , ext = (req.options.ext || this.options.ext)
    , nameParts = name.split('.')
    , changed = false
    , src = '';

  u.each(nameParts, function(part, index){
    if(alias.hasOwnProperty(part)){
      nameParts[index] = alias[part];
    }
  });

  name = nameParts.join('.');
  if(shim.hasOwnProperty(name)){
    src = shim[name].src;
  } else {
    src = name.replace(/\./g, '/');
    src = z.config.root + src + '.' + ext;
  }

  return src;
}

/**
 * Add a request to the queue.
 * 
 * @param {String} url
 * @param {Loader} obj
 */ 
Plugable.prototype.enqueue = function(url, obj){
  this._queue[url] = obj;
}

/**
 * Check the queue to see if an url is loading.
 *
 * @param {String} url
 */
Plugable.prototype.has = function(url){
  return this._queue.hasOwnProperty(url)
}

/**
 * Load a request.
 *
 * @param {Object} req
 * @param {Function} next
 * @param {Function} error
 */
Plugable.prototype.load = function(req, next, error){
  var self = this;
  if(!req.url){
    req.url = this._makeUrl(req);
  }
  if(this.options.req){
    req = u.defaults(this.options.req, req);
  }

  // Ensure that we only load an item once.
  // If a module requests the same URL again, have it subscribe to the 
  // request alreay in progress.
  if(!this.has(req.url)){
    this.enqueue(req.url, new this._loader(req));
  }
  this._queue[req.url].done(function(res){
    self._loadEvent(req, res, next, error);
  }, error);
}


/**
 * ----------------------------------------------------------------------
 * Loader
 *
 * A class that contains some common functionality for z's script loader
 * and its ajax loader.
 */

LOADER_STATE = {
  PENDING: 0,
  DONE: 1,
  FAILED: -1
};

var Loader = z.Loader = z.Class({
  
  __new__: function(req, options){
    this.options = u.defaults(this.options, options);
    this.node = false;
    this._state = LOADER_STATE.PENDING;
    this._onReady = [];
    this._onFailed = [];
    this._value = false;
    this.__init__.apply(this, arguments);
    this.load(req);
  },

  __init__: function(){
    // no-op
  },

  load: function(req){
    // No op
  },

  /**
   * Callbacks to run on done.
   *
   * @param {Function} onReady
   * @param {Function} onFailed
   */
  done: function(onReady, onFailed){
    if(onReady && u.isFunction(onReady)){
      (this.isDone())?
        onReady(this._value) :
        this._onReady.push(onReady);
    }
    if(onFailed && u.isFunction(onFailed)){
      (this.isFailed())?
        onFailed(this._value):
        this._onFailed.push(onFailed);
    }
  },

  /**
   * Resolve the loader based on the passed state.
   *
   * @param {Mixed} arg
   * @param {Integer} state
   */
  _resolve: function(arg, state){
    if(state){
      this._state = state;
    }

    var self = this;

    if(this.isDone()){
      u.each(self._onReady, function(fn){
        fn(arg);
      });
      this._onReady = [];
      return;
    }

    if(this.isFailed()){
      u.each(self._onFailed, function(fn){
        fn(arg);
      });
      this._onFailed = [];
      return;
    }
  }

});

u.each(['Done', 'Pending', 'Failed'], function(state){
  Loader.prototype['is' + state] = function(){
    return this._state === LOADER_STATE[state.toUpperCase()];
  } 
});


/**
 * ----------------------------------------------------------------------
 * z.Scripts
 *
 * z's scripts loader.
 */

var Script = z.Script = Loader.extend({

  options: {
    nodeType: 'text/javascript',
    charset: 'utf-8',
    async: true
  },

  /**
   * Create a script node.
   *
   * @return {Element}
   */
  create: function(){
    var node = this._value = document.createElement('script');
    node.type = this.options.nodeType || 'text/javascript';
    node.charset = this.options.charset;
    node.async = this.options.async;
    return node;
  },

  /**
   * Load a request
   */
  load: function(req){

    var node = this.create()
      , head = document.getElementsByTagName('head')[0]
      , self = this
      , settings = this.scriptSettings
      , defaults = {
          url: ''
        };

    req = u.defaults(defaults, req);

    node.setAttribute('data-from', (req.from || req.url));

    _scriptLoadEvent(node, function(node){
      self._resolve(node, LOADER_STATE.DONE);
    }, function(e){
      self._resolve(e, LOADER_STATE.FAILED);
    });

    // For ie8, code may start running as soon as the node
    // is placed in the DOM, so we need to be ready:  
    Script.currentlyAddingScript = node;
    node.src = req.url;
    head.appendChild(node);
    // Clear out the current script after DOM insertion.
    Script.currentlyAddingScript = null;
  }

});

/**
 * The following methods and properties are for older browsers, which
 * may start defining a script before it is fully loaded.
 */
Script.useInteractive = false;
Script.currentlyAddingScript = null;
Script.interactiveScript = null;
Script.getInteractiveScript = function(){
  if (Script.interactiveScript && Script.interactiveScript.readyState === 'interactive') {
    return Script.interactiveScript;
  }

  u.eachReverse(Script.scripts(), function (script) {
    if (script.readyState === 'interactive') {
      Script.interactiveScript = script;
      return true;
    }
  });
  return Script.interactiveScript;
}

Script.scripts = function(){
  return document.getElementsByTagName('script');
} 

/**
 * Configure the event listener.
 */
var _scriptLoadEvent = (function(){

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
      Script.useInteractive = true;
      node.attachEvent('onreadystatechange', function(){
        // if(node.readyState === 'loaded'){  // I could swear this was correct.
        if(node.readyState === 'complete'){
          next(node);
          Script.interactiveScript = null;
        }
      });
      // Error handler not possible I beleive.
    }

  } else {
    
    loader = function(node, next, err){
      node.addEventListener('load', function(e){
        next(node);
      }, false);
      node.addEventListener('error', function(e){
        err(e);
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

var AJAX_STATE = {
  PENDING: 0,
  OPENED: 1,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  DONE: 4,
  FAILED: -1
};

var HTTP_METHODS = [
  'GET',
  'PUT',
  'POST',
  'DELETE'
];

var Ajax = z.Ajax = Loader.extend({

  options: {
    defaults: {
      url: '',
      method: 'GET',
      data: false
    }
  },

  load: function(req){
    this.__super__(req);

    var request
      , self = this
      , method = 'GET';

    req = u.defaults(this.options.defaults, req);
    
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

    request.onreadystatechange = function(){
      if(AJAX_STATE.DONE === this.readyState){
        if(200 === this.status){
          self._value = this.responseText;
          self._resolve(self._value, AJAX_STATE.DONE);
        } else {
          self._value = this.status;
          self._resolve(this.status, AJAX_STATE.FAILED);
        }
      }
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
  },

  _buildQueryStr: function(data){
    var query = []
      ;
    for(var key in data){
      query.push(key + '=' + data[key]);
    }
    return query.join('&');
  }

});

u.each(['Done', 'Pending', 'Failed'], function(state){
  Ajax.prototype['is' + state] = function(){
    return this._state === AJAX_STATE[state.toUpperCase()];
  } 
});


/**
 * Provides AMD compatability. Use exactly as you would with any other 
 * AMD system. This also allows z to import AMD modules natively.
 *
 * @param {String} name (optional)
 * @param {Array} reqs
 * @param {Fnction} factory
 */
root.define= function(name, reqs, factory){

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

  var mod = z(name);

  u.each(reqs, function(req){
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

    if(false === u.isEmpty(root.exports)){
      result = root.exports;
    }

    if(root.module.exports){
      result = root.module.exports;
    }

    root.exports = noConflictExports;
    root.module = noConflictModule;

    return result;
  });

}

root.define.amd = {
  jQuery: true
}


/**
 * The default plugin, used for loading js files.
 */
z.plugin('script', Script, function(req, res, next, error){
  var name = req.from;
  z.ensureModule(name);
  next();
}, {
  ext: 'js'
});

/**
 * Load other files.
 */
z.plugin('ajax', Ajax, function(req, res, next, error){
  var name = req.from;
  z(name, function(){ return res; }).done(next, error);
}, {
  req: {
    method: 'GET',
  },
  ext: 'txt'
});


}));