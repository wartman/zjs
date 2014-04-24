/*!
 * zjs 0.3.3
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: 2014-04-24T17:17Z
 */

(function (global, factory) {

  if ( typeof module === "object" && typeof module.exports === "object" ) {
    // For CommonJS environments.
    module.exports = factory;
  } else {
    factory(global);
  }

}( typeof window !== "undefined" ? window : this, function (global, undefined) {

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
    if (ctx) fn.bind(ctx);
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
    global.addEventListener('message', onMessage, true);
    return function (fn, ctx) { enqueueFn(fn, ctx) && global.postMessage(msg, '*'); };
  }
})();

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
}

/**
 * A super stripped down promise-like thing.
 *
 * @constructor
 */
var wait = function(){
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
 * @return {wait} 
 */
wait.prototype.done = function(onReady, onFailed){
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
 * Resolve the wait.
 *
 * @param {*} value Value to pass to callbacks
 * @param {Object} ctx Set 'this'
 */
wait.prototype.resolve = function(value, ctx){
  this._state = 1;
  this._dispatch(this._onReady, value, ctx);
  this._onReady = [];
}

/**
 * Reject the wait.
 *
 * @param {*} value Value to pass to callbacks
 * @param {Object} ctx Set 'this'
 */
wait.prototype.reject = function(value, ctx){
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
wait.prototype._dispatch = function (fns, value, ctx) {
  this._value = (value || this._value);
  ctx = (ctx || this);
  var self = this;
  each(fns, function(fn){ fn.call(ctx, self._value); });
}

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
  if( !(this instanceof z) ){
    return new z(name, factory);
  }

  // Raise an error if a namespace is redefined
  if(z.namespaceExists(name)){
    throw Error('Namespace was already defined: ' + name);
  }
  delete z.env.namespaces[name];

  var namespace = name;
  while ( (namespace = namespace.substring(0, namespace.lastIndexOf('.'))) ) {
    if(z.namespaceExists(namespace) || namespace.indexOf('@') >= 0){
      break;
    }
    z.env.namespaces[namespace] = true;
  }

  // Register this loader
  z.env.modules[name] = this;

  this._wait = new wait();
  this._state = z.env.MODULE_STATE.PENDING;
  this._moduleName = name;
  this._definition = false;
  this._dependencies = [];
  this._plugins = {};
  this._factory = null;

  if (!name.indexOf('@') >= 0){
    z.createObjectByName(name);
  }

  if(factory && ('function' === typeof factory) ){
    if(factory.length < 2){
      this.exports(factory);
    } else {
      factory(this.imports.bind(this), this.exports.bind(this));
    }
  }
}

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
  root: '',
  map: {},
  shim: {},
  modules: {},
  plugins: {},
  pluginPattern: /([\s\S]+?)\!/,
  environment: false,
  MODULE_STATE: {
    PENDING: 0,
    LOADED: 1,
    ENABLING: 2,
    ENABLED: 3,
    FAILED: -1
  }
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
    return ( z.env[key] || false );
  }
  if ( 'map' === key ) {
    return z.map(val);
  } else if ( 'shim' === key ) {
    return z.shim(val);
  }
  z.env[key] = val;
  return z.env[key];
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
  if (!z.env.map[path]) {
    z.env.map[path] = [];
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
  z.env.map[path].push(provides);
}

/**
 * Shim a module. This will work with any module that returns
 * something in the global scope.
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
  z.env.shim[module] = options;
}

/**
 * Register a plugin.
 */
z.plugin = function (name, callback) {
  if ( "function" === typeof callback ) {
    z.env.plugins[name] = callback.bind(z);
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
 * Check if a module is mapped to a path.
 *
 * @param {String} module
 * @return {String | Bool}
 */
z.getMappedPath = function (module) {
  var mappedPath = false;
  each(z.env.map, function (maps, path) {
    each(maps, function (map) {
      if (map.test(module)){
        mappedPath = path;
        var matches = map.exec(module);

        // NOTE: The following doesn't take ordering into account.
        // Could pose an issue for paths like: 'foo/*/**.js'
        // Think more on this. Could be fine as is! Not sure what the use cases are like.
        if (matches.length > 2) {
          mappedPath = mappedPath
            .replace('**', matches[1].replace(/\./g, '/'))
            .replace('*', matches[2]);
        } else if (matches.length === 2) {
          mappedPath = mappedPath
            .replace('*', matches[1]);
        }
      }
    });
  });
  return mappedPath;
}

/** 
 * Create a namespace path, ensuring that every level is defined
 * @example
 *    foo.bar.baz -> (foo={}), (foo.bar={}), (foo.bar.baz={})
 *
 * @param {String} namespace
 */
z.createObjectByName = function (namespace, exports, env) {
  var cur = env || global
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
  var cur = env || global
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

z.checkEnv = function () {
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
  if (!z.config('environment')) z.checkEnv();
  return z.env.environment === 'node'
    || z.env.environment === 'server';
};

/**
 * Are we running z on a client?
 */
z.isClient = function () {
  if (!z.config('environment')) z.checkEnv();
  return z.env.environment != 'node'
    && z.env.environment != 'server';
};

/* 
 * ----------------
 * Instance Methods
 * ----------------
 */

/**
 * Import a module
 *
 * @param {String} module
 * @return {z}
 */
z.prototype.imports = function (module) {
  if ( z.env.pluginPattern.test(module) ) {
    var parts = module.match(z.env.pluginPattern);
    module = module.replace(parts[0], '');
    this._plugins[module] = parts[1];
  }
  this._dependencies.push(module);
  return this;
}

/**
 * Define this module when all dependencies are ready.
 *
 * @param {Function} factory
 * @return {z}
 */
z.prototype.exports = function (factory) {
  var self = this;
  this._factory = factory;
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
    this.getDependencies();
  } else if (this.isLoaded()) {
    this.runFactory();
  } else if (this.isFailed()) {
    this._wait.reject();
  } else if (this.isEnabled()) {
    this._wait.resolve();
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

/**
 * Iterate through deps and load them.
 *
 * @return {z}
 */
z.prototype.getDependencies = function () {
  var queue = []
    , self = this
    , len = this._dependencies.length;

  each(this._dependencies, function(item){
    if (!z.getObjectByName(item)) queue.push(item);
  });

  len = queue.length;
  var remaining = len;

  if(len > 0){
    each(queue, function(item){
      var loader = global.Z_MODULE_LOADER;
      if ( self._plugins[item] ) {
        loader = z.env.plugins[self._plugins[item]];
      }
      loader(item, function(){
        remaining -= 1;
        if(remaining <=0 ){
          self.isLoaded(true);
          self.enable();
        }
      }, function(reason){
        self.disable('Could not load dependency: ' + item);
      });
    });
  } else {
    this.isLoaded(true);
    this.enable();
  }

  return this;
}

/**
 * Run the factory, making sure dependncies have been enabled.
 *
 * @api private
 */
z.prototype.runFactory = function () {
  var self = this;

  if (this.isEnabled() || this.isEnabling()) return;

  this.isEnabling(true);

  each(this._dependencies, function ensureDependency (module) {
    if (!self.isEnabling()) return;

    var current = z.env.modules[module];

    if (z.env.shim.hasOwnProperty(module)){
      if(!z.getObjectByName(module)) {
        self.disable('A shimmed module could not be loaded: [' + module + '] for module: ' + self._moduleName);
      }
    } else if (!z.env.modules.hasOwnProperty(module)) {
      console.log(module, current);
      self.disable('A dependency was not loaded: [' + module + '] for module: ' + self._moduleName);
    } else if (current.isFailed()) {
      self.disable('A dependency failed: ['+ module + '] for module: ' + self._moduleName);
    } else if (!current.isEnabled()) {
      // Set this module as loaded, but not enabling.
      self.isLoaded(true);
      // Wait for the dependency to enable, then try again.
      current.enable().done(function () { self.enable(); });
    }
  });

  if (!this.isEnabling()) return;

  this.isEnabled(true);

  // Don't define the namespace twice.
  if (this._definition) return;

  if (!this._factory) {
    this.disable('No factory defined: ' + this._moduleName);
    return;
  }

  if (z.isClient()) {
    // Don't export modules prefixed by '@' to a global var. This is mostly used by 
    // shimmed modules, as they'll typically define their own global variable.
    if(this._moduleName.indexOf('@') >= 0) {
      this._factory();
      this._definition = true;
    } else {
      z.createObjectByName(this._moduleName, this._factory());
      this._definition = z.getObjectByName(this._moduleName);
    }
  }

  if (z.isServer()) {
    // Don't run factories in a node env.
    this._factory = this._factory.toString();
    this._definition = true;
  }

  this.enable();
}

/**
 * Set up methods for checking the module state.
 */
each(['Enabled', 'Enabling', 'Loaded', 'Pending', 'Failed'], function ( state ) {
  var modState = z.env.MODULE_STATE[state.toUpperCase()];
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
 * Globals
 * -------
 */

if(!global.Z_MODULE_LOADER && z.isClient()){

  var visited = {};

  var onLoadEvent = (function (){
    var testNode = document.createElement('script')
    if (testNode.attachEvent){
      return function(node, wait){
        var self = this;
        this.done(next, err);
        node.attachEvent('onreadystatechange', function () {
          if(node.readyState === 'complete'){
            wait.resolve();
          }
        });
        // Can't handle errors with old browsers.
      }
    }
    return function(node, wait){
      node.addEventListener('load', function (e) {
        wait.resolve();
      }, false);
      node.addEventListener('error', function (e) {
        wait.reject();
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
  global.Z_MODULE_LOADER = function (module, next, error) {
    var src = z.env.root + ( z.getMappedPath(module)
      || module.replace(/\./g, '/') + '.js' );

    if (visited.hasOwnProperty(src)) {
      visited[src].done(next, error);
      return;
    }

    var node = document.createElement('script')
      , head = document.getElementsByTagName('head')[0];

    node.type = 'text/javascript';
    node.charset = 'utf-8';
    node.async = true;
    node.setAttribute('data-module', module);

    visited[src] = new wait();
    visited[src].done(next, error);

    onLoadEvent(node, visited[src]);

    node.src = src;
    head.appendChild(node);
  }

  /**
   * The default file loader (uses AJAX)
   *
   * @param {String} file The file to load
   * @param {String} type The type of file to load (eg, 'txt' or 'json')
   *    Defaults to 'json'.
   * @param {Function} next Run on success
   * @param {Funtion} error Run on error
   */
  global.Z_FILE_LOADER = function (file, type, next, error) {

    if (arguments.length < 4) {
      error = next;
      next = type;
      type = 'txt'; 
    }

    var src = z.env.root + ( z.getMappedPath(file)
      || file.replace(/\./g, '/') + '.' + type )

    if(visited.hasOwnProperty(src)){
      visited[src].done(next, error);
      return;
    }

    visited[src] = new wait();
    visited[src].done(next, error);

    if(global.XMLHttpRequest){
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

  /**
   * Default file plugin.
   */
  z.plugin('txt', function (module, next, error) {
    global.Z_FILE_LOADER(module, 'txt', function (data) {
      z(module).exports( function () { return data; } ).done(next);
    }, error);
  });

}

// Export z.
z.global = global;
global.z = global.z || z;

}));