/**
 * zjs @VERSION
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: @DATE
 */

(function(global, factory){

  if ( typeof module === "object" && typeof module.exports === "object" ) {
    // For CommonJS environments.
    module.exports = factory;
  } else {
    factory(global);
  }

}( typeof window !== "undefined" ? window : this, function ( global, undefined ) {

/*
 * -------
 * Helpers
 * -------
 */

/**
 * Ensure async loading.
 */
var nextTick = (function () {
  var fns = []
    , enqueueFn = function ( fn ) {
        return fns.push(fn) === 1;
      }
    , dispatchFns = function ( ctx ) {
        var toCall = fns
          , i = 0
          , len = fns.length;
        fns = [];
        while(i < len){
          toCall[i++]();
        }
      };

  if ( typeof setImmediate !== "undefined" && ( "function" === typeof setImmediate) ) { // ie10, node < 0.10
    return function ( fn, ctx ) {
      enqueueFn(fn) && setImmediate(dispatchFns);
    };
  }

  if ( typeof process === "object" && process.nextTick ) { // node > 0.10
    return function(fn, ctx){
      enqueueFn(fn) && process.nextTick(dispatchFns);
    }
  }

  if ( global.postMessage ) { // modern browsers
    var isAsync = true;
    if ( global.attachEvent ) {
      var checkAsync = function(){
        isAsync = false;
      }
      global.attachEvent('onmessage', checkAsync);
      global.postMessage('__checkAsync', '*');
      global.detachEvent('onmessage', checkAsync);
    }

    if ( isAsync ) {
      var msg = "__promise" + new Date
        , onMessage = function(e){
            if(e.data === msg){
              e.stopPropagation && e.stopPropagation();
              dispatchFns();
            }
          };

      global.addEventListener?
        global.addEventListener('message', onMessage, true) :
        global.attachEvent('onmessage', onMessage);

      return function(fn, ctx){
        enqueueFn(fn) && global.postMessage(msg, '*');
      }

    }
  }

  return function (fn, ctx) { // old browsers.
    enqueueFn(fn) && setTimeout(dispatchFns, 0);
  };
})();

/**
 * Iterate over arrays OR objects.
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

/*
 * ---
 * API
 * ---
 */

/**
 * The module factory.
 *
 * @param {String} name Assign a namespace to this module.
 * @param {Function} factory Define a namespace via callback.
 * @constructor
 * @return {z instance}
 */
var z = function (name, factory) {
  if( !(this instanceof z) ){
    return new z(name);
  }

  // Raise an error if a namespace is redefined
  if(z.namespaceExists(name)){
    throw Error('Namespace was already defined: ' + name);
  }
  delete z.env.namespaces[name];

  var namespace = name;
  while ( (namespace = namespace.substring(0, namespace.lastIndexOf('.') ) ) ) {
    if(z.getObjectByName(namespace)){
      break;
    }
    z.env.namespaces[namespace] = true;
  }

  // Register this loader
  z.env.modules[name] = this;

  this._state = z.env.MODULE_STATE.PENDING;
  this._namespaceString = name;
  this._namespace = z.createNamespace(name);
  this._dependencies = [];
  this._factory = null;
  this._onFailed = [];
  this._onReady = [];

  if(factory && ('function' === typeof factory) ){
    if(factory.length < 2){
      this._factory = factory;
    } else {
      factory.call(this);
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
  modules: {},
  environment: 'browser',
  MODULE_STATE: {
    PENDING: 0,
    LOADED: 1,
    ENABLED: 2,
    FAILED: -1
  }
};

/**
 * A holder for the global var.
 */
z.global = global;

/**
 * Check if a namespace has been defined.
 *
 * @param {String} namespace
 */
z.namespaceExists = function ( namespace ) {
  return !z.env.namespaces[namespace] 
    && z.env.namespaces[namespace] !== undefined;
}

/**
 * Map imports to a given path.
 *
 * @param {String} path Should be a fully-qualified path.
 * @param {Array} provides A list of modules this path provides.
 */
z.map = function ( path, provides ) {
  if(!z.env.map[path]){
    z.env.map[path] = [];
  }
  z.env.map[path].concat(provides);
}

/**
 * Check if a namespace is mapped to a path.
 *
 * @param {String} namespace
 * @return {String | Bool}
 */
z.getMappedPath = function ( namespace ) {
  var mappedPath = false;
  each(z.env.map, function(map, path){
    if(map.indexOf(namespace) > -1){
      mappedPath = path;
    }
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
z.createNamespace = function ( namespace, exports, env ) {
  var cur = env || z.global
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
z.getObjectByName = function ( name, env ) {
  var cur = env || z.global
    , parts = name.split('.');
  for (var part; part = parts.shift(); ) {
    if(typeof cur[part] !== "undefined"){
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;  
}

/* 
 * ----------------
 * Instance Methods
 * ----------------
 */

/**
 * Import a namespace
 *
 * @param {String} namespace
 * @return {z}
 */
z.prototype.import = function ( namespace ) {
  this._dependencies.push(namespace);
  return this;
}

/**
 * Define this namespace when all dependencies are ready.
 *
 * @param {Function} factory
 * @return {z}
 */
z.prototype.export = function ( factory ) {
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

  if(this.isPending()){
    this.getDependencies();
    return this;
  }

  if(this.isLoaded()){
    this._define();
    return this;
  }

  if(this.isFailed()){
    this._dispatch(this._onFailed);
    this._onFailed = [];
    return this;
  }

  if(this.isEnabled()){
    this._dispatch(this._onReady);
    this._onReady = [];
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
z.prototype.done = function ( onReady, onFailed ) {
  var self = this;
  nextTick(function(){
    if(onReady && ( "function" === typeof onReady)){
      (self.isEnabled())
        ? onReady.call(self)
        : self._onReady.push(onReady);
    }
    if(onFailed && ( "function" === typeof onFailed)){
      (self.isFailed())
        ? onFailed.call(self)
        : self._onFailed.push(onFailed);
    }
  });
  return this;
}

/**
 * Callbacks to run on an error.
 * Alias for z.prototype.done(null, {Function})
 *
 * @param {Function} onFailed
 * @return {z}
 */
z.prototype.catch = function ( onFailed ) {
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
z.prototype.disable = function ( reason ) {
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
    if (!z.namespaceExists(item)) queue.push(item);
  });

  len = queue.length;
  var remaining = len;

  if(len > 0){
    each(queue, function(item){
      z.global.MODULE_LOADER(item, function(){
        remaining -= 1;
        if(remaining <=0 ){
          console.log('Loaded: ', self._namespaceString);
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
z.prototype._define = function () {
  var state = true
    , self = this;

  // Make sure each of the deps has been enabled. If any need to be enabled, 
  // stop loading and enable them.
  each(this._dependencies, function ensureDependency ( namespace ) {
    if(!state){
      return;
    }

    if(!z.env.modules.hasOwnProperty(namespace)){
      self.disable('A dependency was not loaded: '+ namespace);
      state = false;
      return;
    }

    var current = z.env.modules[namespace];

    if(current.isFailed()){
      self.disable('A dependency failed: '+ namespace);
      state = false;
      return;
    }

    if(!current.isEnabled()){
      current.enable().done(function enableWhenReady () {
        console.log('Enabling: ', self._namespaceString);
        self.enable();
      });
      state = false;
      return;
    }
  });

  if(!state){
    return;
  }

  if(!this._factory){
    this.disable('No factory defined: ' + this._namespaceString);
  }

  if(z.env.environment !== 'node'){
    this._factory.call(this._namespace);
  } else {
    this._factory = this._factory.toString();
  }

  // If 'exports' is defined, make that the base export of the current namespace.
  if(this._namespace.hasOwnProperty('exports')){
    var exports = this._namespace.exports;
    z.createNamespace(this._namespaceString, exports);
    this._namespace = z.getObjectByName(this._namespaceString);
  }

  console.log(this._namespace);

  this.isEnabled(true);
  this.enable();
}

/**
 * Helper to dispatch a function queue.
 *
 * @param {Array} fns
 * @param {Object} ctx
 * @api private
 */
z.prototype._dispatch = function(fns, ctx){
  ctx = ctx || this;
  each(fns, function(fn){ fn.call(ctx); });
}

/**
 * Set up methods for checking the module state.
 */
each(['Enabled', 'Loaded', 'Pending', 'Failed'], function ( state ) {
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

/**
 * The default loader and associated handlers.
 */
if(!z.global.MODULE_LOADER){
  z.global.MODULE_LOADER = function ( namespace, next, error ) {
    var src = z.getMappedPath(namespace)
      , node = document.createElement('script')
      , head = document.getElementsByTagName('head')[0];

    if(!src){
      src = namespace.replace(/\./g, '/') + '.js';
    }

    src = z.env.root + src;

    node.type = 'text/javascript';
    node.charset = 'utf-8';
    node.async = true;
    node.setAttribute('data-namespace', namespace);

    z.global.MODULE_ON_LOAD_EVENT(node, function ( node ) {
      next();
    }, function(e){
      error(e);
    });

    node.src = src;
    head.appendChild(node);
  }

  z.global.MODULE_ON_LOAD_EVENT = (function () {
    var testNode = document.createElement('script')
      , loader = null;

    if (testNode.attachEvent){
      loader = function(node, next, err){
        node.attachEvent('onreadystatechange', function () {
          if(node.readyState === 'complete'){
            next(node);
          }
        });
        // Can't handle errors with old browsers.
      }
    } else {
      loader = function(node, next, err){
        node.addEventListener('load', function ( e ) {
          next(node);
        }, false);
        node.addEventListener('error', function ( e ) {
          err(e);
        }, false);
      }
    }

    return loader;
  })();
}

/**
 * `z` is aliased as `module` to allow for more readable code.
 * Run z.noConflict() to return `module` to its original owner.
 */
var _lastModule = z.global.module;
z.global.module = z;

/**
 * Return `module` to its original owner.
 */
z.noConflict = function () {
  z.global.module = _lastModule;
}

// Return z.
global.z = global.z || z;

}));