'use strict';
/*!
 * zjs 2.0.0
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: 2014-07-16T21:25Z
 */

(function (factory) {
  if ( typeof module === "object" && typeof module.exports === "object" ) {
    // For CommonJS environments.
    factory(module.exports);
  } else {
    factory(window);
  }
}( function (root, undefined) {

  // ZJS
  // ===

  // z's root. The primary API for z.
  var z = root.z = function (name, factory) {
    var mod = new Module(name, factory);
    mod.enable();
    return mod;
  };

  // The current version.
  z.VERSION = '2.0.0',

  // Storage for modules, plugins, etc.
  z.env = {
    namespaces: {},
    modules: {},
    plugins: {},
    maps: {
      items: {},
      namespaces: {}
    }
  };

  // Configuration store.
  z.configuration = {
    root: '',
    defineExports: true,
    env: '',
    'compile.running': false,
    'compile.full': false
  };

  // Internal helpers
  // ----------------

  // Ensure async loading.
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
      while (i < len) { 
        toCall[i++]();
      }
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

  // A super stripped down promise-like thing.
  function Wait () {
    this._state = 0;
    this._onReady = [];
    this._onFailed = [];
    this._value = null;
  };

  // Run when done waiting.
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
  };

  // Resolve the Wait.
  Wait.prototype.resolve = function(value, ctx){
    this._state = 1;
    this._dispatch(this._onReady, value, ctx);
    this._onReady = [];
  };

  // Reject the Wait.
  Wait.prototype.reject = function(value, ctx){
    this._state = -1;
    this._dispatch(this._onFailed, value, ctx);
    this._onFailed = [];
  };

  // Helper to run callbacks
  Wait.prototype._dispatch = function (fns, value, ctx) {
    this._value = (value || this._value);
    ctx = (ctx || this);
    var self = this;
    each(fns, function(fn){ fn.call(ctx, self._value); });
  };

  // Get all the keys in an object.
  function keys (obj) {
    if ("object" !== typeof obj) return [];
    if (Object.keys) return Object.keys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Get the size of an object
  function size (obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : keys(obj).length;
  };

  // Iterate over arrays or objects.
  function each (obj, callback, context) {
    if(!obj){
      return obj;
    }
    context = (context || obj);
    if(Array.prototype.forEach && obj.forEach){
      obj.forEach(callback)
    } else if (obj instanceof Array) {
      for (var i = 0; i < obj.length; i += 1) {
        if (obj[i] && callback.call(context, obj[i], i, obj)) {
          break;
        }
      }
    } else {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (key && callback.call(context, obj[key], key, obj)) {
            break;
          }
        }
      }
    }
    return obj;
  };

  // Run through each item in an array, then resolve a Wait
  // once all items have been iterated through.
  //
  // example:
  //
  //    eachWait(object, function(item, next, error) {
  //      // do something with 'item', then do the next thing
  //      next();
  //    })
  //    .done(function () {
  //      console.log("Last item ran!")
  //    }, function (reason) {
  //      // Handle errors here.
  //    });
  //
  function eachWait (obj, callback, context) {
    var len = size(obj);
    var current = 0;
    var wait = new Wait();
    context = context || obj;
    var next = function () {
      current += 1;
      // We're at the last item, so resolve the wait.
      if (current === len) wait.resolve();
    };
    var error = function (reason) {
      wait.reject(reason);
    };
    // Run an 'each' loop
    each(obj, function (item) {
      callback.call(context, item, next, error);
    });
    return wait;
  };

  // A simple shim for Function.bind
  function bind (func, ctx) {
    if (Function.prototype.bind && func.bind) return func.bind(ctx);
    return function () { func.apply(ctx, arguments); };
  };

  // Check z's env and map any requests that need it.
  function _mapRequest (path) {
    if (z.env.maps.items.hasOwnProperty(path.obj)) {
      path.src = z.env.maps.items[path.obj];
      if (!_isPath(path.src)) path.src = _nameToPath(path.src) + '.js';
      return path;
    }
    each(z.env.maps.namespaces, function (ns, map) {
      var match = new RegExp(map + '\\.');
      if (match.test(path.obj)) {
        var item = _nameToPath(path.obj.replace(match, ''));
        slashed = (ns.lastIndexOf('/') !== (ns.length - 1))? ns + '/' : ns;
        path.src = slashed + item + '.js';
        // Break the loop.
        return true;
      }
    });
    return path;
  };

  // Check if the passed item is a path
  function _isPath (obj) {
    return obj.indexOf('/') >= 0;
  };

  // Convert a path into an object name
  function _pathToName (path, options) {
    options = options || {};
    if (_isPath(path)
      && (path.indexOf('.') >= 0) 
      && options.stripExt) {
      // Strip extensions.
      path = path.substring(0, path.lastIndexOf('.'));
    }
    path = path.replace(/\//g, '.');
    return path;
  };

  // Convert an object name to a path
  function _nameToPath (obj, options) {
    if (_isPath(obj)) {
      // This is probably already a path.
      return obj;
    }
    obj = obj.replace(/\./g, '/');
    return obj;
  };

  // Parse a request
  function _parseRequest (req, root) {
    root = root || z.config('root');
    var path = {obj:'', src:''};
    if (_isPath(req)) {
      path.obj = _pathToName(req, {stripExt:true});
      path.src = req;
    } else {
      path.obj = req;
      path.src = _nameToPath(req) + '.js';
    }
    path = _mapRequest(path);
    // Add root.
    path.src = root + path.src;
    return path;
  };

  // Get a path from a request.
  function _getPath (req, root) {
    return _parseRequest(req, root).src;
  };

  // Get an period-delimited object name from a request
  function _getName (req, root) {
    return _parseRequest(req, root).obj;
  };

  // Create a new object from a provided string, ensuring each
  // level is defined.
  function _createObjectByName (name, exports, env) {
    var cur = env || root;
    var parts = name.split('.');
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
  };

  // Get an object that matches the provided string, or return `null`
  // if the object is undefined.
  function _getObjectByName (name, env) {
    var cur = env || root;
    var parts = name.split('.');
    for (var part; part = parts.shift(); ) {
      if(typeof cur[part] !== "undefined"){
        cur = cur[part];
      } else {
        return null;
      }
    }
    return cur;  
  };

  // Investigate the env
  function _checkEnv () {
    if (typeof module === "object" && module.exports) {
      z.config('env', 'node');
    } else {
      z.config('env', 'client');
    }
  };

  // Create an error
  function _error (reason) {
    if (reason instanceof Error) {
      throw reason;
    } else {
      throw new Error(reason);
    }
  };

  // Check if a namespace has been defined
  function _namespaceExists (namespace) {
    return ( z.env.namespaces.hasOwnProperty(namespace)
      && z.env.namespaces[namespace] !== undefined );
  };

  // Register a namespace. This won't actually create a javascript object
  // (use `createObjectByName` for that purpose), but is used to ensure
  // modules are not overwritten
  function _ensureNamespace (namespace) {
    // 'ns' is the value that will be returned. For example, if
    // 'Foo.Bar.Bin' is passed to this function, the returned namespace
    // will be 'Foo.Bar'
    var ns = namespace.substring(0, namespace.lastIndexOf('.'));
    // Throw an error if a namespace is redefined
    if(_namespaceExists(namespace)){
      _error('Namespace was already defined: ' + namespace);
      delete z.env.namespaces[namespace];
    }
    while ( (namespace = namespace.substring(0, namespace.lastIndexOf('.'))) ) {
      if(_namespaceExists(namespace)){
        break;
      }
      z.env.namespaces[namespace] = true;
    }
    return ns;
  };

  // Are we running on a server?
  function _isServer () {
    if (!z.config('env')) _checkEnv();
    return z.config('env') === 'node'
      || z.config('env') === 'server';
  };

  // Are we running on a browser?
  function _isClient () {
    if (!z.config('env')) _checkEnv();
    return z.config('env') != 'node'
      && z.config('env') != 'server';
  };

  // API
  // ---

  // Set or get a configuation option. To set several options
  // at once, pass an object to `key`. To get an option without
  // changing its value, simply omit the `value` arg.
  z.config = function (key, value) {
    if ('object' === typeof key) {
      for (var item in key) {
        z.config(item, key[item]);
      }
      return;
    }
    if (value) {
      if ('map' === key) return z.map(value);
      if ('namespaces' === key) return z.map.namespace(value);
      z.configuration[key] = value;
    }
    return ('undefined' !== typeof z.configuration[key]) 
      ? z.configuration[key] : false;
  };

  // Map an import to the given path.
  // example:
  //
  //    z.map('Foo', 'libs/foo.min.js');
  //    z.imports('Foo'); // -> Imports from libs/foo.min.js
  //
  // Note that this method will automatically work with any 
  // script that exports a global var, so long as `item` is 
  // equal to the global you want. Here is an example for jQuery:
  //
  //    z.map('$', 'libs/jQuery.min.js')
  //
  z.map = function (item, path) {
    if ('object' === typeof item) {
      each(item, function (value, key) {
        z.map(key, value);
      });
      return;
    }
    z.env.maps.items[item] = path;
  };

  // Create a namespace map.
  // example:
  //
  //    z.map.namespace('Foo.Bin', 'libs/FooBin');
  //    // The following import will now import 'lib/FooBin/Bax.js'
  //    // rather then 'Foo/Bin/Bax.js'
  //    z.imports('Foo.Bin.Bax');
  //
  z.map.namespace = function (ns, path) {
    if ('object' === typeof ns) {
      each(ns, function (value, key) {
        z.map.namespace(key, value);
      });
      return;
    }
    z.env.maps.namespaces[ns] = path;
  };

  // Define an import
  z.imports = function (/*...*/) {
    if (arguments.length === 1) {
      return _getObjectByName(arguments[0]);
    }
  };

  // Use a plugin
  z.plugin = function (plugin, req, next, error) {
    if (z.env.plugins.hasOwnProperty(plugin)) {
      return z.env.plugins[plugin](req, next, error);
    } else {
      // Try to load a plugin
      z.load(plugin, function () {
        if (!z.env.plugins.hasOwnProperty(plugin)) {
          _error("Plugin was not found: " + plugin);
          return;
        }
        z.plugin(plugin, req, next, error);
      }, error);
    }
  };

  // Register a plugin. If loading a plugin from a package,
  // be sure the name is EXACTLY THE SAME as the package
  // name. For example:
  //
  //    z.package('App.Plugins.Foo', function (Foo) {
  //      Foo.exports.default(function (self) {
  //        z.plugin.register('App.Plugins.Foo', function (req, next, error) { ... });
  //      });
  //    });
  //
  z.plugin.register = function (name, definition) {
    z.env.plugins[name] = definition;
  };

  // Export helpers. DO NOT USE SYS IN COMPILED PROJECTS!
  z.sys = {
    getPath: _getPath,
    getName: _getName,
    isClient: _isClient,
    isServer: _isServer,
    createObjectByName: _createObjectByName,
    getObjectByName: _getObjectByName
  };

  // Holds visited urls to ensure they are only loaded once.
  var visited = {};

  if (_isClient()) {

    // The default module loader.
    z.load = function (mod, next, error, options) {

      if (mod instanceof Array) {
        eachWait(mod, function (item, next, error) {
          z.load(item, next, error);
        })
        .done(next, error);
        return;
      }

      var src = _getPath(mod, z.config('root'));

      if (visited.hasOwnProperty(src)) {
        visited[src].done(next, error);
        return;
      }

      var wait = visited[src] = new Wait();
      var script = document.createElement('script');
      var head = document.getElementsByTagName('head')[0];
      var done = false;

      script.type = 'text/javascript';
      script.charset = 'utf-8';
      script.async = true;
      script.setAttribute('data-module', mod);

      wait.done(next, error);

      script.onload = script.onreadystatechange = function() {
        if (!done && (!this.readyState ||
            this.readyState === "loaded" || this.readyState === "complete") ) {
          done = true;
          wait.resolve();
          // Handle memory leak in IE
          script.onload = script.onreadystatechange = null;
        }
      };

      script.src = src;
      head.appendChild(script);
    };

    // The default file loader (uses AJAX)
    z.file = function (file, next, error, options) {
      var src = _getPath(file, z.config('root'));
      if(visited.hasOwnProperty(src)){
        visited[src].done(next, error);
        return;
      }
      var wait = visited[src] = new Wait();
      wait.done(next, error);
      if(root.XMLHttpRequest){
        var request = new XMLHttpRequest();
      } else { // code for IE6, IE5
        var request = new ActiveXObject("Microsoft.XMLHTTP");
      }
      request.onreadystatechange = function(){
        if(4 === this.readyState){
          if(200 === this.status){
            wait.resolve(this.responseText);
          } else {
            wait.reject(this.status);
          }
        }
      }
      request.open('GET', src, true);
      request.send();
    }

  } else if (_isServer()) {

    // Make z global.
    GLOBAL.z = z;

    // Requre Node's file system.
    var _fs = require('fs');

    // Load a script using Node
    z.load = function (module, next, error) {
      var src = _getPath(module, root);
      if (visited.hasOwnProperty(src)) return next();
      try {
        require(src);
        next();
      } catch (e) {
        error(e);
      }
    };

    // Load a file using Node
    z.file = function (file, next, error) {
      var src = _getPath(file, root);
      if(visited.hasOwnProperty(src)){
        visited[src].done(next, error);
        return;
      }
      visited[src] = new Wait();
      visited[src].done(next, error);
      _fs.readFile(src, 'utf-8', function (err, data) {
        if (err) {
          visited[src].reject(err);
          return;
        }
        visited[src].resolve(data);
      });
    };

  };

  // Default file plugin.
  z.plugin.register('file', function (req, next, error) {
    z.file(req, next, error);
  });

  // Module
  // ------

  function Module (name, factory) {
    var self = this;
    this.factory = factory || function () {};
    // Ensure the name is available.
    this.define(name);
    this.deps = this.findDeps();
    this.wait = new Wait();
    this.isPending = true;
    this.isDisabled = false;
    this.isEnabled = false;
    this.isEnabling = false;
    this._waitForCallback = false;
    if (this.factory.length > 0) {
      this._waitForCallback = true;
      this.done(function () {
        self._waitForCallback = false;
      });
    }
  };

  Module.prototype.define = function (name) {
    z.env.modules[name] = this;
    // Set this Module's name.
    this._name = name;
    // Register the namespace.
    this._namespace = _ensureNamespace(name);
    _createObjectByName(name);
  };

  // RegExp to find an import.
  var _importsMatch = /z\.imports\(([\s\S\r\n]+?)\)/g;

  // RegExp to check for plugins
  var _pluginCheck = /([\s\S]+)\s*?:\s*?([\s\S]+)/g;

  // RegExp to cleanup module paths
  var _cleanModulePath = /[\r|\n|'|"|\s]/g;

  // Parse the factory to find all dependencies in this module.
  Module.prototype.findDeps = function () {
    var factory = this.factory.toString();
    var self = this;
    var deps = [];
    factory.replace(_importsMatch, function (matches, importList) {
      var imports = importList.split(',');
      each(imports, function (dep) {
        var plugin = dep.match(_pluginCheck);
        var item = {}
        if (plugin) {
          item.plugin = plugin.pop().replace(_cleanModulePath, "");
          item.id = plugin.pop().replace(_cleanModulePath, "");
        } else {
          item.id = dep.replace(_cleanModulePath, "");
        }
        // Allow for module shortcuts.
        if (item.id.indexOf('.') === 0) {
          item.id = self._namespace + item.id;
        }
        deps.push(item);
      });
    });
    return deps;
  };

  Module.prototype.enable = function () {
    if (this.isDisabled || this.isEnabling) return;
    if (this.isEnabled) {
      if (!this._waitForCallback) this.wait.resolve();
      return;
    }

    var queue = [];
    var self = this;

    each(this.deps, function (item) {
      if(!item.imported) {
        queue.push(item);
        item.imported = true;
      }
    });

    if (queue.length > 0) {

      this.isEnabling = true;
      eachWait(queue, function getImports (item, next, error) {
        // Wait for a package to load its deps before continuing,
        // and ensure that an object is defined before continuing.
        var check = function () {
          var name = item.id;
          if (_isPath(name)) name = _pathToName(name);
          if (z.env.modules.hasOwnProperty(name)) {
            z.env.modules[name].done(next, error);
          } else {
            if (_getObjectByName(name)) {
              next();
            } else {
              error('A dependency was not loaded: ' + name);
            }
          }
        };
        // Load the item, either with a plugin or the default method.
        if (z.env.modules.hasOwnProperty(item.id)) {
          z.env.modules[item.id].done(next, error);
        } else if (item.plugin) {
          z.plugin(item.plugin, item.id, check, error);
        } else {
          z.load(item.id, check, error);
        }
      })
      .done(function () {
        self.runFactory();
        this.isEnabling = false;
      }, function (reason) {
        this.isEnabling = false;
        self.disable(reason);
      });

    } else {
      this.runFactory();
    }
  };

  Module.prototype.done = function (onDone, onError) {
    this.wait.done(onDone, onError);
  };  

  Module.prototype.runFactory = function () {
    // Don't define if we're compiling.
    if (z.config('compile.running') === true) return this.wait.resolve();
    if (this._waitForCallback) {
      var self = this;
      this.factory(function (err) {
        if (err) {
          self.disable(err);
        } else {
          self.isEnabled = true;
          self.wait.resolve();
        }
      });
    } else {
      this.factory();
      this.isEnabled = true;
      this.wait.resolve();
    }
  };

  Module.prototype.disable = function (e) {
    if (e instanceof Error) throw e;
    this.isDisabled = true;
    this.wait.reject(e);
  };

}));