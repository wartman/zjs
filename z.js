/*!
 * zjs 1.0.0
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: 2014-05-01T17:47Z
 */

(function (factory) {
  if ( typeof module === "object" && typeof module.exports === "object" ) {
    // For CommonJS environments.
    factory(module.exports);
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
    root.addEventListener('message', onMessage, true);
    return function (fn, ctx) { enqueueFn(fn, ctx) && root.postMessage(msg, '*'); };
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
  // Allows the use of z without 'new'
  if( !(this instanceof z) ) return new z(name, factory);

  // Register the namespace (or throw an error if already defined)
  z.ensureNamespace(name);  
  // Register this module
  z.env.modules[name] = this;

  this._wait = new wait();
  this._state = z.env.MODULE_STATE.PENDING;
  this._moduleName = name;
  this._defined = false;
  this._imports = [];
  this._exports = [];
  this._body = false;
  this._plugins = {};
  this._factory = null;

  // Export the namespace if the name isn't prefixed by '@'
  if (!name.indexOf('@') >= 0) z.createObjectByName(name);

  if(factory && ('function' === typeof factory) ){
    if(factory.length === 2){
      factory(this.imports.bind(this), this.exports.bind(this));
    } else if (factory.length === 1) {
      factory(this);
    } else {
      this.exports(factory);
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
  VERSION: '1.0.0',
  MODULE_STATE: {
    PENDING: 0,
    LOADED: 1,
    WORKING: 2,
    READY: 3,
    ENABLED: 4,
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
 *    z('app.foo', function (imports, exports) {
 *      imports('app.bar');
 *      exports('bin', 'bin');
 *      exports('foo', {bar:'bar', baz:'baz'});
 *      exports('baz', function () {
 *        // Using a callback like this will allow
 *        // you to use any imported modules.
 *        var bar = app.bar;
 *        // Will define `app.foo.baz.bar`
 *        return {bar: bar};
 *      });
 *      exports(function () {
 *        // [name] is optional.
 *        // The following will define `app.foo.bix`
 *        return {bix:'bix'};
 *      });
 *      exports(function () {
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
 * Will run [factory] after the module is done
 * loading all requested imports/exports. Returning a value 
 * here won't do anything -- instead, define any exports you want
 * the natural way, by setting properties for the current object.
 *
 * Body may only be called once per module.
 *
 * @example
 *    z('app.foo', function (module) {
 *      module.imports('app.bar');
 *      module.body(function () {
 *        app.bar; // Is useable.
 *        app.foo.bin = 'bar'; // Just set properties.
 *        // NOTE:
 *        // The following will define nothing:
 *        return {app:'bar'}
 *        // Use `z#exports` if you want to return a value.
 *      });
 *    });
 *
 * @param {Type} name descrip
 * @param {Type} name descrip
 * @return {Type} 
 */
z.prototype.body = function (factory) {
  var self = this;
  if (this._body) {
    this.disable('Cannot define body twice: ' + this._moduleName);
    return;
  }
  this._body = factory;
  nextTick(function(){
    self.enable();
  });
  return this;
};

/**
 * Enable this module.
 *
 * @return {z}
 */
z.prototype.enable = function () {
  if (this.isPending()) {
    this._loadImports();
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

/**
 * Iterate through deps and load them.
 *
 * @api private
 * @return {z}
 */
z.prototype._loadImports = function () {
  var queue = []
    , self = this
    , len = this._imports.length;
  this.isWorking(true);
  each(this._imports, function(item){
    if (!z.getObjectByName(item)) queue.push(item);
  });
  len = queue.length;
  var remaining = len;
  if(len > 0){
    each(queue, function(item){
      var loader = root.Z_MODULE_LOADER;
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
};

/**
 * Make sure dependncies have been enabled.
 *
 * @api private
 */
z.prototype._ensureDependencies = function () {
  var self = this;
  if (this.isEnabled() || this.isWorking()) return;
  this.isWorking(true);
  each(this._imports, function ensureDependency (module) {
    if (!self.isWorking()) return;
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
  if (!this.isWorking()) return;
  this.isReady(true);
  this.enable();
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
    } else {
      definition = extend(definition, z.getObjectByName(self._moduleName));
      z.createObjectByName(self._moduleName, definition);
    }
  });
  if (this._body) this._body();
  this.isEnabled(true);
  this.enable();
};

/**
 * Set up methods for checking the module state.
 */
each(['Enabled', 'Ready', 'Working', 'Loaded', 'Pending', 'Failed'], function ( state ) {
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
if(!root.Z_MODULE_LOADER && z.isClient()){

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
  root.Z_MODULE_LOADER = function (module, next, error) {
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
  root.Z_FILE_LOADER = function (file, type, next, error) {

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

  root.Z_MODULE_LOADER = function (module, next, error) {
    var src = z.env.root + ( z.getMappedPath(module)
      || module.replace(/\./g, '/') );
    if (visited.hasOwnProperty(src)) return next();
    try {
      require(src);
    } catch (e) {
      error(e);
    }
  };

  root.Z_FILE_LOADER = function (file, type, next, error) {
    if (arguments.length < 4) {
      error = next;
      next = type;
      type = 'txt'; 
    }
    var src = z.env.root + ( z.getMappedPath(file)
      || file.replace(/\./g, '/') + '.' + type );
    if(visited.hasOwnProperty(src)){
      visited[src].done(next, error);
      return;
    }
    visited[src] = new wait();
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
  root.Z_FILE_LOADER(module, 'txt', function (data) {
    z(module).exports( function () { return data; } ).done(next);
  }, error);
});

// Export z.
z.global = root;
root.z = root.z || z;

}));