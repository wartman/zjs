

/**
 * zjs 0.1.71
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: 2014-03-27T14:33Z
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
 * z.util
 *
 * A few utility funcs.
 */

var forEach = Array.prototype.forEach
  , slice = Array.prototype.slice
  , toString = Object.prototype.toString
  , objKeys = Object.keys
  , undef;

var u = {};

u.each = function(obj, callback, context) {
  if(!obj){
    return obj;
  }
  context = (context || obj);
  if(forEach && obj.forEach){
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

u.isObject = function(obj){
  return obj === Object(obj);
}

u.defaults = function(obj, options){
  if(undefined === options){
    return obj;
  }
  for(var key in obj){
    if(obj.hasOwnProperty(key) && ! options.hasOwnProperty(key)){
      options[key] = obj[key];
    }
  }
  return options;
}

u.keys = function(obj){
  if(!u.isObject(obj)) return [];
  if(objKeys) return objKeys(obj);
  var keys = [];
  for(var key in obj){
    keys.push(key);
  }
  return keys;
}

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

u.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
  u['is' + name] = function(obj) {
    return toString.call(obj) == '[object ' + name + ']';
  };
});

u.isArray = (Array.isArray || function(obj){
  return toString.call(obj) == '[object Array]';
});

// Make things async.
u.async = function(cb, ctx){
  setTimeout(function(){
    cb.apply(ctx, Array.prototype.slice.call(arguments, 2));
  })
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
  if(u.isFunction(name)){
    factory = name;
    name = undef;
  }
  if(z.has(name) && !factory){
    return z.modules[name];
  }
  var mod = _addModule(name);
  if(u.isFunction(factory) && factory.length === 2){
    _runFactory(mod, factory);
  } else if (factory) {
    mod.exports(factory);
  }
  return mod;
}

/**
 * `z` is aliased as `module` to allow for more readable code.
 * Run z.noConflict() to return `module` to its original owner.
 */
var _lastModule = root.module;
root.module = z;

/**
 * Return `module` to its original owner.
 */
z.noConflict = function(){
  root.module = _lastModule;
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
    if(_useInteractive){
      // For < IE9 (and 10, apparently -- seems to get called there too)
      // I think this is because <IE9 runs onload callbacks BEFORE the code
      // executes, while other browsers do it right after.
      node = _currentlyAddingScript || Script.getInteractiveScript();
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
 * Helper for running module factories.
 *
 * @param {Module} mod
 * @param {Function} factory
 * @api private
 */
var _runFactory = function(mod, factory){
  var imports = function(){
    return Module.prototype.imports.apply(mod, arguments);    
  }
  var exports = function(){
    return Module.prototype.exports.apply(mod, arguments);
  }
  factory.call(mod, imports, exports);
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
  env: 'browser',
  auto: true // Set to false to wait for z to start.
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
  } else if (u.isFunction(parent)){
    // Use parent as constructor.
    return _classExtend.call(parent, props);
  } else if(u.isObject(parent)){
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
 * z.Resolver
 *
 * The resolver is basically a very stripped down promise. Having a full-on
 * promise implementation is a bit overkill for the module loader, so this
 * is the smallest implementation we can get away with.
 *
 * Resolvers can, however, be bound to Promise/A+ implementations in the
 * following ways:
 *   var resolver = new z.Resolver;
 *   var promise = new Promise(resolver.ready); // Binds the resolver to the promise.
 *   // or
 *   promise.then(resolver); // Binds the promise to the resolver.
 *   resolver.resolve(onFulfilled, onRejected); // Will resolve the promise.
 */

var RESOLVER_STATE = {
  PENDING: 0,
  READY: 1,
  REJECTED: -1
};

var Resolver = z.Resolver = z.Class({

  /**
   * Initilize the resolver.
   *
   * @param {Object} options (optional)
   */
  __new__: function(){
    this._onReady = [];
    this._onRejected = [];
    this._value = null;
    this._state = RESOLVER_STATE.PENDING;

    if(this.__init__)
      this.__init__.apply(this, arguments);
  },

  /**
   * Add a ready callback. 
   *
   * @param {Function} onReady
   * @param {Function} onRejected
   * @return {Resolver}
   */
  done: function(onReady, onRejected){
    if(onReady){
      (this.isReady())?
        onReady(this._value) :
        this._onReady.push(onReady);
    }
    if(onRejected){
      (this.isRejected())?
        onRejected(this._value) :
        this._onRejected.push(onRejected);
    }
    return this;
  },

  /**
   * Add a failure callback. 
   *
   * @param {Function} onRejected
   * @return {Resolver}
   */
  failed: function(onRejected){
    return this.ready(undefined, onRejected);
  },

  /**
   * An alias for Resolver#ready.
   * This method is here only to ensure that it can be complient
   * with /A+ promises -- please do not try to use the resolver 
   * as a promise.
   *
   * @param {Function} onReady
   * @param {Function} onRejected
   * @return {Resolver}
   */
  then: function(onReady, onRejected){
    return this.ready(onReady, onFailed);
  },

  /**
   * Resolve the resolver with the provided value.
   *
   * @param {Mixed} value
   */
  resolve: function(value){
    this._value = value;
    this._state = RESOLVER_STATE.READY;
    this._dispatch(this._onReady);
  },
  
  /**
   * Reject the resolver with the provided value.
   *
   * @param {Mixed} reason
   */
  reject: function(reason){
    this._value = reason;
    this._state = RESOLVER_STATE.REJECTED;
    this._dispatch(this._onRejected);
  },

  /**
   * A helper function to run callbacks.
   *
   * @param {Array} fns
   */
  _dispatch: function(fns){
    var value = this._value
      , self = this;
    // Execute fns from first added to last.
    while(fns.length){
      var fn = fns.shift();
      fn.call(self, value);
    }
  }

});

/** 
 * Add state helpers to the Resolver prototype.
 */
u.each(['Ready', 'Rejected', 'Pending'], function(state){
  var STATE = state.toUpperCase();
  Resolver.prototype['is'+state] = function(){
    return this._state === RESOLVER_STATE[STATE];
  }
});


/**
 * ----------------------------------------------------------------------
 * z.Script
 *
 * z's script loader. Extends z.Resolver.
 */

var Script = z.Script = Resolver.extend({

  options: {
    nodeType: 'text/javascript',
    charset: 'utf-8',
    async: true
  },

  __init__: function(req, options){
    this.options = u.defaults(this.options, options);
    this.node = false;
    this.load(req);
  },

  /**
   * Create a script node.
   *
   * @return {Element}
   */
  create: function(){
    var node = document.createElement('script');
    node.type = this.options.nodeType || 'text/javascript';
    node.charset = this.options.charset;
    node.async = this.options.async;
    return node;
  },

  /**
   * Load a request
   *
   * @param {Object | String} req
   */
  load: function(req){

    var node = this.create()
      , head = document.getElementsByTagName('head')[0]
      , self = this
      , settings = this.scriptSettings
      , defaults = {
          src: ''
        };

    // Allow the user to just pass an src.
    if(u.isString(req)){
      req = {
        src: req
      };
    }

    req = u.defaults(defaults, req);

    node.setAttribute('data-from', (req.from || req.src));

    _scriptLoadEvent(node, function(node){
      self.resolve(node);
    }, function(e){
      self.reject(e);
    });

    // For ie8, code may start running as soon as the node
    // is placed in the DOM, so we need to be ready:  
    _currentlyAddingScript = node;
    node.src = req.src;
    head.appendChild(node);
    // Clear out the current script after DOM insertion.
    _currentlyAddingScript = null;
  }

});

/**
 * The following methods and properties are for older browsers, which
 * may start defining a script before it is fully loaded.
 */
var _useInteractive = false;
var _currentlyAddingScript = null;
var _interactiveScript = null;
Script.getInteractiveScript = function(){
  if (_interactiveScript && _interactiveScript.readyState === 'interactive') {
    return _interactiveScript;
  }

  u.eachReverse(Script.scripts(), function (script) {
    if (script.readyState === 'interactive') {
      _interactiveScript = script;
      return true;
    }
  });
  return _interactiveScript;
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
      _useInteractive = true;
      node.attachEvent('onreadystatechange', function(){
        // if(node.readyState === 'loaded'){  // I could swear this was correct.
        if(node.readyState === 'complete'){
          next(node);
          _interactiveScript = null;
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
 * Script API
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

var Ajax = z.Ajax = Resolver.extend({

  options: {
    defaults: {
      src: '',
      method: 'GET',
      data: false
    }
  },

  __init__: function(req, options){
    this.options = u.defaults(this.options, options);
    this.load(req);
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
          self.resolve(this.responseText);
        } else {
          self.reject(this.status);
        }
      }
    }

    if(method === "GET" && req.data){
      req.src += '?' + this._buildQueryStr(req.data);
    }

    request.open(method, req.src, true);

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
 * ----------------------------------------------------------------------
 * Ajax API
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
 * ----------------------------------------------------------------------
 * Loader
 *
 * The Loader is ultimately responsable for loading scripts, files, etc.
 * Use the API to register new loaders and filters.
 */

/**
 * Create a new Loader.
 * The setup object is where you define how the loader should function:
 * see the API under the class for more on how to set up Loaders.
 *
 * @param {Object} setup
 */
var Loader = function(setup){
  this._queue = {};
  setup = (setup || {});

  this._filters = (setup.filters || ['default.src']);
  this.options = u.defaults(this.options, setup.options);
  this._method = (setup.method || z.Script);
  this._handler = (setup.handler || function(req, res, next, error){
    next(res);
  });
  this._build = (setup.build || false);
}

/**
 * Default options.
 *
 * @var {Object}
 */
Loader.prototype.options = {
  ext: 'js'
}

/**
 * Run the request through all registered filters.
 *
 * @param {Object} req
 */
Loader.prototype.prefilter = function(req){
  var self = this;
  u.each(this._filters, function(name, index){
    var filter = z.filter(name);
    if(filter)
      req = filter.call(self, req);
  });
  return req;
}

/**
 * Register a method
 *
 * @param {Class} method
 */
Loader.prototype.method = function(method){
  this._method = method;
  return this;
}

/**
 * Register a filter or filters.
 *
 * @param {String | Array} name
 */
Loader.prototype.filters = function(name){
  if(!name){
    return;
  }
  if(u.isArray(name)){
    this._filters.concat(name);
    return;
  }
  this._filters.push(name);
  return this;
}

/**
 * Register handler.
 * Callbacks should have the args 'req', 'res', 'next' and 'error'
 *
 * @param {Function | Array} cb
 */
Loader.prototype.handler = function(cb){
  if(!cb){
    return this;
  }
  this._handler = cb;
  return this;
}

/**
 * A callback to run when in server mode
 */
Loader.prototype.build = function(cb){
  if(!cb){
    return this;
  }
  this._build = cb;
  return this;
}

/**
 * Check the queue to see if an url is loading.
 *
 * @param {String} url
 */
Loader.prototype.has = function(src){
  return this._queue.hasOwnProperty(src);
}

/**
 * Load a request.
 *
 * @param {Object} req
 * @param {Function} next
 * @param {Function} error
 * @param {Function} builder
 */
Loader.prototype.load = function(req, onDone, onRejected){
  var self = this;
  req = this.prefilter(req);
  if(!this.has(req.src)){
    this._queue[req.src] = new this._method(req);
  }
  this._queue[req.src].done(function(res){
    self._handler(req, res, onDone, onRejected);
    if(z.config.env !== 'browser' && self._build){
      z.loader.build(req, res, self);
    }
  }, onRejected);
  return this;
}

/**
 * ----------------------------------------------------------------------
 * Loader API
 */

/**
 * Holds all registered loaders.
 *
 * @var {Object}
 * @api private
 */
var _loaders = {};

/**
 * z Loader API
 * // info on how it works
 * 
 * @param {String} name If this is the only arg passed, 
 *   the method will try to return a loader or will create
 *   a new one.
 * @param {Object} setup (optional) If you pass an arg here,
 *   a new loader will be created EVEN if one already exists
 *   for the provided name.
 * @return {Loader}
 */
z.loader = function(name, setup){
  if(arguments.length <= 1){
    if(_loaders.hasOwnProperty(name)){
      return _loaders[name];
    }
  }

  _loaders[name] = new Loader(setup);
  return _loaders[name];
}

/**
 * A hook to allow the builder to interact with the loader.
 */
z.loader.build = function(req, res, loader){
  // no-op -- defined in Build.js
}

/**
 * filter API
 */
_filters = {};
z.filter = function(name, cb){
  if(arguments.length <= 1){
    if(_filters.hasOwnProperty(name)){
      return _filters[name];
    }
    return false;
  }

  _filters[name] = cb 
  return _filters[name];
}


/**
 * ----------------------------------------------------------------------
 * Default loaders and filters
 */

/**
 * Script loader
 */
z.loader('script', {
  method: z.Script,
  filters: ['default.src'],
  handler: function(req, res, next, error){
    z.ensureModule(req.from);
    next();
  },
  options: {
    ext: 'js'
  }
});

/**
 * Ajax loader
 */
z.loader('ajax', {
  method: z.Ajax,
  filters: ['default.src', 'ajax.method'],
  handler: function(req, res, next, error){
    z(req.from, function(){ return res; }).done(next, error);
  },
  options: {
    ext: 'js',
    method: 'GET'
  }
});

/**
 * Get a src from a request.
 *
 * @param {Object} req
 */
z.filter('default.src', function(req){
  if(req.src){
    return req;
  }

  var shim = z.config.shim
    , alias = z.config.alias
    , name = req.from
    , ext = (req.options.ext || this.options.ext)
    , nameParts = name.split('.')
    , parsed = []
    , src = '';

  u.each(nameParts, function(part, index){
    if(alias.hasOwnProperty(part)){
      if(alias[part] === "" || alias[part] === false){
        return;
      }
      parsed.push(alias[part]);
    } else {
      parsed.push(nameParts[index])
    }
  });

  name = parsed.join('.');

  if(shim.hasOwnProperty(name)){
    src = shim[name].src;
  } else {
    src = name.replace(/\./g, '/');
    src = z.config.root + src + '.' + ext;
    src = src.trim('/')
  }

  req.src = src;

  return req;
});

/**
 * Method filter
 *
 * @param {Object} req
 */
z.filter('ajax.method', function(req){
  req.method = (req.method || this.options.method);
  return req;
});


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

  this._state = MODULE_STATE.PENDING;

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

  if(!name){
    this._factory = factory;
  } else {
    if(null === this._factory) this._factory = {};
    this._factory[name] = factory;
  }

  // Make sure all exports are defined first.
  u.async(function(){
    this.enable();
  }, this);

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

  if(this.isPending()){
    _import.call(this);
    return this;
  }

  if(this.isLoaded()){
    _define.call(this);
    return this;
  }

  if(this.isFailed()){
    // dispatch the failed queue.
    _dispatch.call(this, this._onFailed, this);
    this._onFailed = [];
    return this;
  }

  if(this.isEnabled()){
    // Dispatch the done queue.
    _dispatch.call(this, this._onReady, this);
    this._onReady = [];
  }

  return this;
}

/**
 * Disable the module
 */
Module.prototype.disable = function(error){
  this.isFailed(true);
  return this.enable();
}

/**
 * Callbacks to fire once the module has loaded all dependencies. 
 * If called on a enabled module, the callback will be fired immediately.
 *
 * @param {Function} onReady
 * @param {Function} onFailed
 */
Module.prototype.done = function(onReady, onFailed){
  u.async(function(){
    // Keep things async.
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
  }, this);
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

/**
 * Set up methods for checking the module state.
 */
u.each(['Enabled', 'Loaded', 'Pending', 'Failed'], function(state){
  var modState = MODULE_STATE[state.toUpperCase()];
  /**
   * Check module state.
   *
   * @param {Boolean} state If true, will set the state.
   * @return {Boolean}
   */
  Module.prototype['is' + state] = function(set){
    if(set) this._state = modState;
    return this._state === modState;
  } 
});

/**
 * Helper to dispatch a function queue.
 *
 * @param {Array} fns
 * @param {Object} ctx
 * @api private
 */
var _dispatch = function(fns, ctx){
  u.each(fns, function(fn){
    fn.call(ctx);
  });
}

/**
 * Import a module's deps.
 *
 * @api private
 */
var _import = function(){
  var queue = []
    , self = this;

  u.each(this._deps, function(item){
    if(false === z.has(item.from)){
      queue.push(item);
    }
  });

  var remaining = queue.length;

  if(remaining > 0){
    
    u.each(queue, function(item, index){
      var type = (item.options.type || 'script')
        , loader = z.loader(type);

      loader.load(item, function(){
        remaining -= 1;
        if(remaining <=0 ){
          self.isLoaded(true);
          self.enable();
        }
      }, function(e){
        self.disable();
        throw e;
      });

    });

  } else {
    this.isLoaded(true);
    this.enable();
  }
}

/**
 * Define a module (that is, run its factory)
 *
 * @api private
 */
var _define = function(){
  var context = {}
    , self = this;

  // Make sure u.each of the deps has been enabled. If any need to be enabled, stop loading and
  // enable them.
  u.each(this._deps, function(dep){

    if(!context){
      return;
    }

    if(!z.has(dep.from)){
      throw new Error('A dependency is not in the registry: '+ dep.from);
    }

    var current = z(dep.from)
      , parts = {};

    if(current.isFailed()){
      self.disable();
      throw new Error('A dependency failed: '+ dep.from);
      context = false;
      return true;
    }

    if(!current.isEnabled()){
      current.enable().done(function(){
        self.enable();
      });
      context = false;
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

  if(!context){
    return;
  }

  try {
    if(z.config.env !== 'server'){
      if(u.isFunction(this._factory)){
        this._definition = this._factory(context);
      } else if(u.isObject(this._factory)) {
        this._definition = {};
        u.each(this._factory, function(item, key){
          if(u.isFunction(item)){
            self._definition[key] = item(context)
          } else {
            self._definition[key] = item;
          }
        })
      } else {
        this._definition = this._factory;
      }
    } else {
      // If we're in a node.js env we don't want to execute the factory.
      this._definition = true;
    }
  } catch(e) {
    this.disable();
    throw e;
    return;
  }
  this.isEnabled(true);
  this.enable();
}

/**
 * Module API in src/core.js
 */


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
    if(typeof name === 'array'){
      reqs = name;
      name = undefined;
    } else {
      reqs = [];
    }
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


}));