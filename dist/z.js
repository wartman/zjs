

/**
 * zjs 0.1.0
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: 2014-02-21T23:10Z
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
 * u
 *
 * z's uity classes and functions.
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
 * The top-level API for z
 */
var z = root.z = function(name, factory){
  if(z.has(name) && !factory){
    return z.modules[name];
  }
  if(u.isFunction(name)){
    factory = name;
    name = undef;
  }
  var mod = _add(name);
  if(factory){
    mod.exports(factory);
  }
  return mod;
}

/**
 * Helper for adding modules.
 */
var _add = function(name){
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
      z.tmp = new Module();
      return z.tmp;
    }
  }

  z.modules[name] = new Module();
  return z.modules[name];
}

/**
 * Expose util funcs.
 */
z.u = z.util = u;

z.modules = {};
z.plugins = {};
z.tmp = null;

/**
 * Static methods
 */

z.has = function(name){
  return z.modules.hasOwnProperty(name);
}

z.config = {
  root: '',
  shim: {},
  alias: {},
  env: 'browser'
};
z.setup = function(options){
  z.config = u.defaults(z.config, options);
}

z.ensureModule = function(name){
  var tmp = z.tmp;
  if(null === tmp){
    return;
  }
  z.tmp = null;
  if(!tmp instanceof Module){
    return;
  }
  z.modules[name] = tmp;
  return;
}

z.script = function(req, next, error){
  var scr = new Script(req, z.config.script).ready(next, error);
  return scr;
}
z.script.isPending = function(url){
  return Script.isPending(url);
}

z.ajax = function(req, next, error){
  var ajx = new Ajax(req, z.config.ajax)
  ajx.ready(next, error);
  return ajx;
}

z.plugin = function(name, plugin){
  if(!plugin){
    if(z.plugins.hasOwnProperty(name)){
      return z.plugins[name];
    }
    throw new Error('Plugin was not found: '+name);
    return false;
  }

  if(!u.isFunction(plugin)){
    throw new TypeError('[plugin] must be a function or undefined: '+typeof plugin);
    return false;
  }

  z.plugins[name] = plugin;
  return z.plugins[name];
}

/**
 * Shortcuts
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
 * z's module loading system.
 * Compatable with AMD.
 */

var MODULE_STATE = {
  PENDING: 0,
  LOADED: 1,
  ENABLED: 2,
  FAILED: -1
};

var Module = function(deps){
  this._deps = (deps && u.isArray(deps))? deps : [];
  this._state = MODULE_STATE.PENDING;
  this._factory = null;
  this._definition = null;
  this._onReady = [];
  this._onFailed = [];
}

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
      item.replace(_alias, function(match, actual, replace){
        name = actual.trim();
        alias = replace.trim();
        return match;
      });
    }
    if(self._definition.hasOwnProperty(name)){
      (single)?
      ctx = self._definition[name] :
      ctx[alias] = self._definition[name];
    }
  });

  return ctx;
}

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

  dep.url = _findUrl(dep);

  this._deps.push(dep);

  return this;
}

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

Module.prototype.enable = function(next, error){
  this.ready(next, error);
  _resolve(this);
  return this;
}

Module.prototype.ready = function(onReady, onFailed){
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

Module.prototype.fail = function(onFailed){
  return this.ready(undef, onFailed);
}

u.each(['Enabled', 'Loaded', 'Pending', 'Failed'], function(state){
  Module.prototype['is' + state] = function(){
    return this._state === MODULE_STATE[state.toUpperCase()];
  } 
});

var _alias = /([\s\S]+?)\@([\s\S]+?)$/g;

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

  // TODO:
  // Check z's global state before continuing.

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
    // Dispatch the ready queue.
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
      try{
        var type = (item.options.type || 'script')
          , loader = z.plugin(type);

        loader(item, function(){
          remaining -= 1;
          if(remaining <=0 ){
            _resolve(mod, MODULE_STATE.LOADED);
          }
        }, function(e){
          _resolve(mod, MODULE_STATE.FAILED);
          throw e;
        });
      } catch(e) {
        // If a plugin is not found, an error will be thrown.
        _resolve(mod, MODULE_STATE.FAILED);
        throw e;
      }
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
      current.enable().ready(function(){
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

_findUrl = function(req){
  var shim = z.config.shim
    , alias = z.config.alias
    , name = req.from
    , ext = (req.options.ext || 'js')
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


LOADER_STATE = {
  PENDING: 0,
  DONE: 1,
  FAILED: -1
};

var Loader = z.Class({
  
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
    // no-op
  },

  ready: function(onReady, onFailed){
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
 * Fit's Script loader, which uses the DOM to get js files.
 */
/**
 * Script class.
 */
var Script = Loader.extend({

  options: {
    nodeType: 'text/javascript',
    charset: 'utf-8',
    async: true
  },

  __init__: function(){
    Script.scripts.push(this);
  },

  create: function(){
    var node = this._value = document.createElement('script');
    node.type = this.options.nodeType || 'text/javascript';
    node.charset = this.options.charset;
    node.async = this.options.async;
    return node;
  },

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

    Script.pending.push(req.url);

    _scriptLoadEvent(node, function(node){
      self._resolve(node, LOADER_STATE.DONE);
    }, function(e){
      self._resolve(e, LOADER_STATE.FAILED);
    });

    // For ie8, code may start running as soon as the node
    // is placed in the DOM, so we need to be ready:  
    this.currentlyAddingScript = node;
    node.src = req.url;
    head.appendChild(node);
    // Clear out the current script after DOM insertion.
    this.currentlyAddingScript = null;
  }

});

Script.pending = [];

Script.isPending = function(url){
  return Script.pending.indexOf(url) >= 0;
}

Script.currentlyAddingScript = null;
Script.interactiveScript = null;
Script.getInteractiveScript = function(){
  if (Script.interactiveScript && Script.interactiveScript.readyState === 'interactive') {
    return interactiveScript;
  }

  u.eachReverse(Script.scripts(), function (script) {
    if (script.readyState === 'interactive') {
      return (self.interactiveScript = script);
    }
  });
  return interactiveScript;
}

Script.scripts = [];

Script.getScripts = function() {
  return Script.scripts;
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
        if(node.readyState === 'loaded'){
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
        Script.interactiveScript = null;
      }, false);
      node.addEventListener('error', function(e){
        err(e);
        Script.interactiveScript = null;
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

var Ajax = Loader.extend({

  options: {
    defaults: {
      url: '',
      method: 'GET',
      data: false
    }
  },

  load: function(req){
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
          if(this.response){
            self._value = this.response;
          } else {
            self._value = this.responseText
          }
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
z.plugin('script', function(req, next, error){
  var name = req.from
    , self = this;
  if(z.script.isPending(req.url)){
    return;
  }
  z.script(req, function(node){
    z.ensureModule(name);
    next();
  }, error);
});

/**
 * Load other files.
 */
z.plugin('ajax', function(req, next, error){
  var name = req.from
    , self = this
    , mod = z(name); // The module that will wrap the file.

  req.method = 'GET';
  z.ajax(req, function(data){
    mod.exports(function(){ return data; });
    next();
  }, error);
});


}));