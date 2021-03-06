/*!
 * zjs @VERSION
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: @DATE
 */

(function (factory) {
  if ( typeof module === "object" && typeof module.exports === "object" ) {
    // For CommonJS environments.
    root = {};
    factory(root);
    module.exports = root.z;
  } else {
    factory(window);
  }
}( function (root, undefined) {

/*
 * -------
 * Helpers
 * -------
 */

/**
 * Ensure async loading.
 *
 * @param {Function} fn Run this function async
 * @param {Object} ctx Set 'this'
 */
var nextTick = ( function () {
  var fns = [];
  var enqueueFn = function (fn, ctx) {
    if (ctx) bind(fn, ctx);
    return fns.push(fn);
  };
  var dispatchFns = function () {
    var toCall = fns
      , i = 0
      , len = fns.length;
    fns = [];
    while (i < len) { toCall[i++](); }
  };
  if (typeof setImmediate == 'function') {
    return function (fn, ctx) { enqueueFn(fn, ctx) && setImmediate(dispatchFns) }
  }
  // legacy node.js
  else if (typeof process != 'undefined' && typeof process.nextTick == 'function') {
    return function (fn, ctx) { enqueueFn(fn, ctx) && process.nextTick(dispatchFns); };
  }
  // fallback for other environments / postMessage behaves badly on IE8
  else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {
    return function (fn, ctx) { enqueueFn(fn, ctx) && setTimeout(dispatchFns); };
  } else {
    var msg = "tic!" + new Date
    var onMessage = function(e){
      if(e.data === msg){
        e.stopPropagation && e.stopPropagation();
        dispatchFns();
      }
    };
    root.addEventListener('message', onMessage, true);
    return function (fn, ctx) { enqueueFn(fn, ctx) && root.postMessage(msg, '*'); };
  }
})();

/**
 * Get all the keys in an object.
 *
 * @param {*} obj
 * @return {Array} 
 */
var keys = function(obj) {
  if ("object" !== typeof obj) return [];
  if (Object.keys) return Object.keys(obj);
  var keys = [];
  for (var key in obj) if (_.has(obj, key)) keys.push(key);
  return keys;
};

/** 
 * Get the size of an object
 * 
 * @param {*} obj
 * @return {Integer}
 */
var size = function (obj) {
  if (obj == null) return 0;
  return (obj.length === +obj.length) ? obj.length : keys(obj).length;
};

/**
 * Iterate over arrays or objects.
 *
 * @param {*} obj
 * @param {Function} callback
 * @param {Object} context (optional)
 */
var each = function (obj, callback, context) {
  if(!obj){
    return obj;
  }
  context = (context || obj);
  if(Array.prototype.forEach && obj.forEach){
    obj.forEach(callback)
  } else if ( obj instanceof Array ){
    for (var i = 0; i < obj.length; i += 1) {
      if (obj[i] && callback.call(context, obj[i], i, obj)) {
        break;
      }
    }
  } else {
    for(var key in obj){
      if(obj.hasOwnProperty(key)){
        if(key && callback.call(context, obj[key], key, obj)){
          break;
        }
      }
    }
  }
  return obj;
};

/**
 * Run through each item in an array, then trigger a final callback.
 * The next item in the queue won't be run till you call 'next', allowing
 * for async iteration.
 *
 * @param {*} obj The item to iterate over
 * @param {Function} callback Function to run for EVERY item in `obj`.
 *    Should take `next` and `error` as its arguments. The next callback
 *    will NOT be run until you call it manually.
 * @param {Function} last Function to run after the last item in `obj`
 *    has run.
 * @param {Function} error Function to run if something goes wrong.
 * @param {Mixed} context Set `this` for the callbacks.
 * @return {Type} 
 */
var eachAsync = function (obj, callback, last, error, context) {
  var len = size(obj);
  var current = -1;
  var currentItem;
  context = context || obj;
  var next = function () {
    current += 1;
    currentItem = obj[current];
    if (!currentItem || current === len) {
      last.call(context);
    } else {
      callback.call(context, currentItem, next, error);
    }
  };
  return next();
};

/**
 * Extend an object
 *
 * @param {Object} obj The object to extend
 * @param {Obejct} ... Any number of objects to mixin
 * @return {Object}
 */
var extend = function(obj /*...*/){
  each(Array.prototype.slice.call(arguments, 1), function(source){
    if(source){
      for(var prop in source){
        if (source.hasOwnProperty(prop)) obj[prop] = source[prop];
      }
    }
  });
  return obj;
};

/**
 * A super stripped down promise-like thing.
 *
 * @constructor
 */
var Wait = function(){
  this._state = 0;
  this._onReady = [];
  this._onFailed = [];
  this._value = null;
}

/**
 * Run when done waiting.
 *
 * @param {Function} onReady Add to the onReady queue
 * @param {Function} onFailled Add to the onFailed queue
 * @return {Wait} 
 */
Wait.prototype.done = function(onReady, onFailed){
  var self = this;
  nextTick(function(){
    if(onReady && ( "function" === typeof onReady)){
      (self._state === 1)
        ? onReady.call(self, self._value)
        : self._onReady.push(onReady);
    }
    if(onFailed && ( "function" === typeof onFailed)){
      (self._state === -1)
        ? onFailed.call(self, self._value)
        : self._onFailed.push(onFailed);
    }
  });
  return this;
}

/**
 * Resolve the Wait.
 *
 * @param {*} value Value to pass to callbacks
 * @param {Object} ctx Set 'this'
 */
Wait.prototype.resolve = function(value, ctx){
  this._state = 1;
  this._dispatch(this._onReady, value, ctx);
  this._onReady = [];
}

/**
 * Reject the Wait.
 *
 * @param {*} value Value to pass to callbacks
 * @param {Object} ctx Set 'this'
 */
Wait.prototype.reject = function(value, ctx){
  this._state = -1;
  this._dispatch(this._onFailed, value, ctx);
  this._onFailed = [];
}

/**
 * Helper to run callbacks
 *
 * @param {Array} fns
 * @param {*} value
 * @param {Object} ctx
 * @api private
 */
Wait.prototype._dispatch = function (fns, value, ctx) {
  this._value = (value || this._value);
  ctx = (ctx || this);
  var self = this;
  each(fns, function(fn){ fn.call(ctx, self._value); });
}

/**
 * Check if the passed item is a path
 *
 * @param {String} obj
 * @return {String}
 */
var isPath = function (obj) {
  return obj.indexOf('/') >= 0;
};

/**
 * Convert a path into an object name
 *
 * @param {String} obj
 * @return {String}
 */
var getObjectByPath = function (path, options) {
  options = options || {};
  if (isPath(path)
    && (path.indexOf('.') >= 0) 
    && options.stripExt) {
    // Strip extensions.
    path = path.substring(0, path.lastIndexOf('.'));
  }
  path = path.replace(/\//g, '.');
  return path;
};

/**
 * Convert an object name to a path
 *
 * @param {String} obj
 * @return {String}
 */
var getPathByObject = function (obj) {
  if (isPath(obj)) {
    // This is probably already a path.
    return obj;
  }
  obj = obj.replace(/\./g, '/');
  return obj;
};

/**
 * A simple shim for Function.bind
 *
 * @param {Function} func
 * @param {*} ctx
 * @return {Function} 
 */
var bind = function (func, ctx) {
  if (Function.prototype.bind && func.bind) return func.bind(ctx);
  return function () { func.apply(ctx, arguments); };
};

/*
 * ---
 * API
 * ---
 */

/**
 * The module factory.
 *
 * @example
 *   z('app.main').imports('app.foo').exports(function () { return app.foo; });
 *
 * @constructor
 * @param {String} name - Assign a namespace to this module.
 * @param {Function} factory - Define a namespace via callback.
 * @return {Object}
 */
var z = function (name, factory) {
  if( !(this instanceof z) ) return new z(name, factory);
  if ("function" === typeof name) {
    factory = name;
    name = false;
  }
  this._moduleName = null;
  if (name) this.defines(name);
  this._wait = new Wait();
  this._state = MODULE_STATE.PENDING;
  this._defined = false;
  this._imports = [];
  this._exports = [];
  this._plugins = {};
  this._factory = null;
  if (!name && factory) {
    if (factory.length === 3) {
      factory(bind(this.defines, this), bind(this.imports, this), bind(this.exports, this));
    } else {
      factory(this);
    }
  } else if(factory && ('function' === typeof factory) ){
    if (factory.length === 3) {
      factory(bind(this.defines, this), bind(this.imports, this), bind(this.exports, this));
    } else if (factory.length === 2) {
      factory(bind(this.imports, this), bind(this.exports, this));
    } else if (factory.length === 1) {
      factory(this);
    } else {
      this.exports(factory);
    }
  }
};

/*
 * -------
 * Statics
 * -------
 */

/**
 * Z's environment
 */
z.env = {
  namespaces: {},
  modules: {},
  plugins: {},
};

/**
 * Config settings
 */
z.settings = {
  root: '',
  map: {},
  shim: {},
  environment: ''
};

/**
 * The current version.
 */
z.VERSION = '@VERSION';

/**
 * Module states.
 */
var MODULE_STATE = {
  PENDING: 0,
  LOADED: 1,
  WORKING: 2,
  READY: 3,
  ENABLED: 4,
  FAILED: -1
};

/**
 * Set a config item/items
 *
 * @param {String|Object} key
 * @param {Mixed} val
 */
z.config = function (key, val) {
  if ( "object" === typeof key ) {
    for ( var item in key ) {
      z.config(item, key[item]);
    }
    return;
  }
  if(arguments.length < 2){
    return ('undefined' !== typeof z.settings[key])? z.settings[key] : false;
  }
  if ( 'map' === key ) {
    return z.map(val);
  } else if ( 'shim' === key ) {
    return z.shim(val);
  }
  z.settings[key] = val;
  return z.settings[key];
}

/**
 * Map modules to a given path.
 *
 * @example
 *    z.map('lib/foo.js', ['foo.bar', 'foo.bin']);
 *    // You can also map a file to a base namespace
 *    z.map('lib/foo.js', ['foo.*']);
 *    // The following will now load lib/foo.js:
 *    z('myModule').import('foo.bar').export(function(){ });
 *
 * @param {String} path Should be a fully-qualified path.
 * @param {Array} provides A list of modules this path provides.
 */
z.map = function (path, provides) {
  if ("object" === typeof path){
    for ( var item in path ) {
      z.map(item, path[item]);
    }
    return;
  }
  if (!z.settings.map[path]) {
    z.settings.map[path] = [];
  }
  if (provides instanceof Array) {
    each(provides, function (item) {
      z.map(path, item);
    });
    return;
  }
  provides = new RegExp ( 
    provides
      .replace('**', "([\\s\\S]+?)") // ** matches any number of segments (will only use the first)
      .replace('*', "([^\\.|^$]+?)") // * matches a single segment (will only use the first)
      .replace(/\./g, "\\.")         // escape '.'
      .replace(/\$/g, '\\$')
      + '$'
  );
  z.settings.map[path].push(provides);
}

/**
 * Shim a module. This will work with any module that returns
 * something in the root scope.
 *
 * @param {String} module
 * @param {Object} options
 */
z.shim = function (module, options) {
  if ("object" === typeof module){
    for ( var item in module ) {
      z.shim(item, module[item]);
    }
    return;
  }
  options = options || {}; 
  if (options.map) {
    z.map(options.map, module);
  }
  var mod = z('@shim.' + module);
  if (options.imports) {
    each(options.imports, function (item) {
      mod.imports(item);
    });
  }
  mod.exports(function () {
    return '';
  });
  z.settings.shim[module] = options;
}

/**
 * Register a plugin.
 */
z.plugin = function (name, callback) {
  if ( "function" === typeof callback ) {
    z.env.plugins[name] = bind(callback, z);
  }
}

/**
 * Check if a namespace has been defined.
 *
 * @param {String} namespace
 */
z.namespaceExists = function (namespace) {
  return ( z.env.namespaces.hasOwnProperty(namespace)
    && z.env.namespaces[namespace] !== undefined );
}

/**
 * Register a namespace. This won't actually create a javascript object --
 * use createObjectFromName for this. This is just used to ensure overwrites
 * are caught.
 *
 * @param {String} namespace
 */
z.ensureNamespace = function (namespace) {
  // Raise an error if a namespace is redefined
  if(z.namespaceExists(namespace)){
    throw Error('Namespace was already defined: ' + namespace);
  }
  delete z.env.namespaces[namespace];

  while ( (namespace = namespace.substring(0, namespace.lastIndexOf('.'))) ) {
    if(z.namespaceExists(namespace) || namespace.indexOf('@') >= 0){
      break;
    }
    z.env.namespaces[namespace] = true;
  }
}

/**
 * Parse a request
 *
 * @param {String} module
 * @param {String} root
 * @return {Object}
 */
z.parseRequest = function (module, root) {
  root = root || z.config('root');
  var path = {obj:'', src:''};
  if (isPath(module)) {
    path.obj = getObjectByPath(module, {stripExt:true});
    path.src = module;
  } else {
    path.obj = module;
    path.src = getPathByObject(module) + '.js';
  }
  each(z.config('map'), function (maps, pathPattern) {
    each(maps, function (map) {
      if (map.test(path.obj)){
        path.src = pathPattern;
        var matches = map.exec(path.obj);
        // NOTE: The following doesn't take ordering into account.
        // Could pose an issue for paths like: 'foo/*/**.js'
        // Think more on this. Could be fine as is! Not sure what the use cases are like.
        if (matches.length > 2) {
          path.src = path.src
            .replace('**', matches[1].replace(/\./g, '/'))
            .replace('*', matches[2]);
        } else if (matches.length === 2) {
          path.src = path.src.replace('*', matches[1]);
        }
      }
    });
  });
  // Add root.
  path.src = root + path.src;
  return path;
};

/**
 * Shortcut to get a path from a request.
 *
 * @param {String} module
 * @param {String} root
 * @return {Object}
 */
z.getMappedPath = function (module, root) {
  return z.parseRequest(module, root).src;
};

/**
 * Shortcut to get an object name from a request.
 *
 * @param {String} module
 * @param {String} root
 * @return {Object}
 */
z.getMappedObj = function (module, root) {
  return z.parseRequest(module, root).obj;
};

/** 
 * Create a namespace path, ensuring that every level is defined
 * @example
 *    foo.bar.baz -> (foo={}), (foo.bar={}), (foo.bar.baz={})
 *
 * @param {String} namespace
 */
z.createObjectByName = function (namespace, exports, env) {
  var cur = env || root
    , parts = namespace.split('.');
  for (var part; parts.length && (part = parts.shift()); ) {
    if(!parts.length && exports !== undefined){
      // Last part, so export to this.
      cur[part] = exports;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
  return cur;
}

/**
 * Convert a string into a namespace
 *
 * @param {String} name
 * @param {Object} env (optional)
 */
z.getObjectByName = function (name, env) {
  var cur = env || root
    , parts = name.split('.');
  for (var part; part = parts.shift(); ) {
    if(typeof cur[part] !== "undefined"){
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;  
};

/**
 * Investigate the environment.
 */
var checkEnv = function () {
  if (typeof module === "object" && module.exports) {
    z.config('environment', 'node');
  } else {
    z.config('environment', 'client');
  }
};

/**
 * Are we running z on a server?
 */
z.isServer = function () {
  if (!z.config('environment')) checkEnv();
  return z.config('environment') === 'node'
    || z.config('environment') === 'server';
};

/**
 * Are we running z on a client?
 */
z.isClient = function () {
  if (!z.config('environment')) checkEnv();
  return z.config('environment') != 'node'
    && z.config('environment') != 'server';
};

/* 
 * ----------------
 * Instance Methods
 * ----------------
 */

/**
 * Set the namespace this module will be defining.
 *
 * @example
 *    // As an alternative to passing the module name
 *    // as the first arg in the z constructor, you
 *    // can use 'defines' internally.
 *    z(function (module) {
 *      module.defines('app.foo');
 *      module.exports('foo', 'foo');
 *    });
 *
 *    // This will work with chaining as well.
 *    z().defines('app.foo').exports('foo', 'bar');
 *
 *    // The only reason to do things this way is if
 *    // it appeals to you asthetically.
 *    // Just stay consistant in your app!
 *
 * @param {Type} name descrip
 * @param {Type} name descrip
 * @return {Type} 
 */
z.prototype.defines = function (name) {
  this._moduleName = name;
  // Register the namespace (or throw an error if already defined)
  z.ensureNamespace(name);  
  // Register this module
  z.env.modules[name] = this;
  // Export the namespace if the name isn't prefixed by '@'
  if (!name.indexOf('@') >= 0) z.createObjectByName(name);
  return this;
};

/**
 * Import a module
 *
 * @param {String} module
 * @return {z}
 */
var pluginPattern = /([\s\S]+?)\!/;
z.prototype.imports = function (module) {
  if ( pluginPattern.test(module) ) {
    var parts = module.match(pluginPattern);
    module = module.replace(parts[0], '');
    this._plugins[module] = parts[1];
  }
  this._imports.push(module);
  return this;
}

/**
 * Export an item or items for the current module. If
 * [definition] is a function it will be called after
 * the module finishes collecting all imports. Anything
 * returned from [definition] will be used to define the
 * current export.
 *
 * @example
 *    z('app.foo', function (module) {
 *      module.imports('app.bar');
 *      module.exports('bin', 'bin');
 *      module.exports('foo', {bar:'bar', baz:'baz'});
 *      module.exports('baz', function () {
 *        // Using a callback like this will allow
 *        // you to use any imported modules.
 *        var bar = app.bar;
 *        // Will define `app.foo.baz.bar`
 *        return {bar: bar};
 *      });
 *      module.exports(function () {
 *        // [name] is optional.
 *        // The following will define `app.foo.bix`
 *        return {bix:'bix'};
 *      });
 *      module.exports(function () {
 *        // You can define the root export of a
 *        // module by ommiting [name] and returning a
 *        // function.
 *        // No matter where
 *        // you call this, any previous exports WILL NOT
 *        // be overwritten.
 *        // The following defines `app.foo`
 *        return function () { return 'foo'; };
 *      });
 *    });
 *
 * @param {String} name (optional) Name this export.
 * @param {Mixed} definition
 * @return {z}
 */
z.prototype.exports = function (name, definition) {
  if (arguments.length < 2) {
    definition = name;
    name = false;
  }
  var self = this;
  this._exports.push({
    id: name,
    definition: definition
  });
  nextTick(function(){
    self.enable();
  });
  return this;
}

/**
 * Enable this module.
 *
 * @return {z}
 */
z.prototype.enable = function () {
  if (this.isPending()) {
    this._importDependencies();
  } else if (this.isLoaded()) {
    this._ensureDependencies();
  } else if (this.isReady()) {
    this._enableExports();
  } else if (this.isEnabled()) {
    this._wait.resolve();
  } else if (this.isFailed()) {
    this._wait.reject();
  }
  return this;
}

/**
 * Callbacks to run when the module has finished loading dependencies
 *
 * @param {Function} onReady
 * @param {Function} onFailed
 * @return {z}
 */
z.prototype.done = function (onReady, onFailed) {
  this._wait.done(onReady, onFailed);
  return this;
}

/**
 * Callbacks to run on an error.
 * Alias for z.prototype.done(null, {Function})
 *
 * @param {Function} onFailed
 * @return {z}
 */
z.prototype.catch = function (onFailed) {
  this.done(null, onFailed);
  return this;
}

/**
 * Mark this module as failed.
 *
 * @param {String} reason
 * @throws {Error}
 * @return {z}
 */
z.prototype.disable = function (reason) {
  this.isFailed(true);
  this.catch(function(){
    nextTick(function(){
      throw Error(reason);
    })
  });
  return this.enable();
}

/* 
 * ------------------------
 * Private Instance Methods
 * ------------------------
 */

/**
 * Get the correct loader, checking if it's using a plugin.
 *
 * @param {Sting} item The name of the import to check.
 * @return {Function} 
 */
z.prototype._getLoader = function (item) {
  if (this._plugins[item]) return z.env.plugins[this._plugins[item]];
  return z.load;
};

/**
 * Iterate through deps and load them.
 *
 * @api private
 * @return {z}
 */
z.prototype._importDependencies = function () {
  var queue = [];
  var self = this;
  this.isWorking(true);
  each(this._imports, function(item){
    if (!z.getObjectByName(item)) queue.push(item);
  });
  if (size(queue)) {
    eachAsync(queue, function getImports (item, next, error) {
      if (z.settings.shim[item]) {
        self._importShim(item, next, error);
      } else {
        self._importModule(item, next, error);
      }
    }, function () {
      self.isLoaded(true);
      self.enable();
    }, function (reason) {
      self.disable(reason);
    });
  } else {
    this.isLoaded(true);
    this._ensureDependencies();
  }
  return this;
};

/**
 * Import a z.module
 *
 * @param {String} module
 * @param {Function} next
 * @param {Function} error
 */
z.prototype._importModule = function (module, next, error) {
  var loader = this._getLoader(module);
  loader(module, next, error);
};

/**
 * Load a shimmed import, ensuring each dependency is loaded.
 * As an unwrapped file will execute right away, we need to make sure
 * that all dependencies are loaded BEFORE we load the shimmed script.
 *
 * @param {String} module
 * @param {Function} next
 * @param {Function} error
 */
z.prototype._importShim = function (module, next, error) {
  var loader = this._getLoader(module);
  var shim = z.settings.shim[module];
  if (shim.imports) {
    eachAsync(shim.imports, function (dep, next, error) {
      loader(dep, next, error)
    }, function () {
      loader(module, next, error);
    }, error);
  } else {
    loader(module, next, error);
  }
};

/**
 * Make sure dependncies have been enabled.
 *
 * @api private
 */
z.prototype._ensureDependencies = function () {
  var self = this;
  if (this.isEnabled() || this.isWorking()) return;
  if (!this._imports.length) {
    this.isReady(true);
    this._enableExports();
  }
  this.isWorking(true);
  eachAsync(this._imports, function ensureDependency (module, next, error) {
    if (!self.isWorking()) return;
    // ensure 'module' is written in object syntax
    if (isPath(module)) module = getObjectByPath(module, {stripExt:true});
    var current = z.env.modules[module];
    if (z.settings.shim.hasOwnProperty(module)){
      if(!z.getObjectByName(module)) {
        error('A shimmed module could not be loaded: [' + module + '] for module: ' + self._moduleName);
      } else {
        next();
      }
    } else if (!z.env.modules.hasOwnProperty(module)) {
      error('A dependency was not loaded: [' + module + '] for module: ' + self._moduleName);
    } else if (current.isFailed()) {
      error('A dependency failed: ['+ module + '] for module: ' + self._moduleName);
    } else if (!current.isEnabled()) {
      // Wait for the dependency to enable, then try again.
      current.enable().done(next, error);
    } else {
      next();
    }
  }, function () {
    self.isReady(true);
    self._enableExports();
  }, function (reason) {
    self.disable(reason);
  });
};

/**
 * Enable exports
 *
 * @api private
 */
z.prototype._enableExports = function () {
  if (this._defined) return;
  this._defined = true;
  this.isWorking(true);
  var self = this;
  each(this._exports, function (item) {
    var definition = null;
    if ("function" === typeof item.definition) {
      if (z.isClient()) {
        definition = item.definition();
      } else {
        definition = item.definition.toString();
      }
    } else {
      definition = item.definition;
    }
    if (item.id) {
      z.createObjectByName(self._moduleName + '.' + item.id, definition);
    } else if (definition) {
      definition = extend(definition, z.getObjectByName(self._moduleName));
      z.createObjectByName(self._moduleName, definition);
    }
  });
  this.isEnabled(true);
  this.enable();
};

/**
 * Set up methods for checking the module state.
 */
each(['Enabled', 'Ready', 'Working', 'Loaded', 'Pending', 'Failed'], function ( state ) {
  var modState = MODULE_STATE[state.toUpperCase()];
  /**
   * Check module state.
   *
   * @param {Boolean} state If true, will set the state.
   * @return {Boolean}
   */
  z.prototype['is' + state] = function(set){
    if(set) this._state = modState;
    return this._state === modState;
  } 
});

/* 
 * -------
 * Loaders
 * -------
 */

if (z.isClient()) {
  var visited = {};

  var onLoadEvent = (function (){
    var testNode = document.createElement('script')
    if (testNode.attachEvent){
      return function(node, Wait){
        var self = this;
        this.done(next, err);
        node.attachEvent('onreadystatechange', function () {
          if(node.readyState === 'complete'){
            Wait.resolve();
          }
        });
        // Can't handle errors with old browsers.
      }
    }
    return function(node, Wait){
      node.addEventListener('load', function (e) {
        Wait.resolve();
      }, false);
      node.addEventListener('error', function (e) {
        Wait.reject();
      }, false);
    }
  })();

  /**
   * The default module loader.
   *
   * @param {String} module The module to load. This should be the
   *    module name, not a filepath (e.g., 'app.foo.bar')
   * @param {Function} next Run on success
   * @param {Funtion} error Run on error
   */
  z.load = function (module, next, error, options) {

    if (module instanceof Array) {
      eachThen(module, function (item, next, error) {
        z.load(item, next, error);
      }, next, error);
      return;
    }

    var src = z.getMappedPath(module, z.config('root'));

    if (visited.hasOwnProperty(src)) {
      visited[src].done(next, error);
      return;
    }

    var node = document.createElement('script');
    var head = document.getElementsByTagName('head')[0];

    node.type = 'text/javascript';
    node.charset = 'utf-8';
    node.async = true;
    node.setAttribute('data-module', module);

    visited[src] = new Wait();
    visited[src].done(next, error);

    onLoadEvent(node, visited[src]);

    node.src = src;
    head.appendChild(node);
  };

  /**
   * The default file loader (uses AJAX)
   *
   * @param {String} file The file to load
   * @param {String} type The type of file to load (eg, 'txt' or 'json')
   *    Defaults to 'json'.
   * @param {Function} next Run on success
   * @param {Funtion} error Run on error
   */
  z.file = function (file, next, error, options) {

    var src = z.getMappedPath(file, z.config('root'));

    if(visited.hasOwnProperty(src)){
      visited[src].done(next, error);
      return;
    }

    visited[src] = new Wait();
    visited[src].done(next, error);

    if(root.XMLHttpRequest){
      var request = new XMLHttpRequest();
    } else { // code for IE6, IE5
      var request = new ActiveXObject("Microsoft.XMLHTTP");
    }

    request.onreadystatechange = function(){
      if(4 === this.readyState){
        if(200 === this.status){
          visited[src].resolve(this.responseText);
        } else {
          visited[src].reject(this.status);
        }
      }
    }

    request.open('GET', src, true);
    request.send();
  }

} else if (z.isServer()) {

  // Make z global.
  GLOBAL.z = z;

  var visited = {};
  var fs = require('fs');

  z.load = function (module, next, error) {
    var src = z.getMappedPath(file, root);
    if (visited.hasOwnProperty(src)) return next();
    try {
      require(src);
      next();
    } catch (e) {
      error(e);
    }
  };

  z.file = function (file, next, error, options) {
    var src = z.getMappedPath(file, root);
    if(visited.hasOwnProperty(src)){
      visited[src].done(next, error);
      return;
    }
    visited[src] = new Wait();
    visited[src].done(next, error);
    fs.readFile(src, 'utf-8', function (err, data) {
      if (err) {
        visited[src].reject(err);
        return;
      }
      visited[src].resolve(data);
    });
  };

};

/**
 * Default file plugin.
 */
z.plugin('txt', function (module, next, error) {
  var moduleName = z.getMappedObj(module, z.config('root'));
  z.file(module, function (data) {
    z(moduleName, function () { return data; } ).done(next, error);
  }, error);
});

// Export z.
z.global = root;
root.z = root.z || z;

}));