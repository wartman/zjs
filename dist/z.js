/*!


    __________
   /\_______  \
   \/______/  /
          /  /
         /  /
        /  /______    __
       /\_________\  /\_\
       \/_________/  \/_/



  zjs 2.0.0

  Copyright 2014
  Released under the MIT license

  Date: 2014-07-28T19:51Z
*/

(function (factory) {
  if ( typeof module === "object" && typeof module.exports === "object" ) {
    // For CommonJS environments.
    factory(module.exports);
    global.z = module.exports.z;
  } else {
    factory(window);
  }
}( function (root, undefined) {

// Helpers
// -------

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
}

function defaults (obj, source) {
  if (source) {
    for (var prop in source) {
      if (obj[prop] === void 0) obj[prop] = source[prop];
    }
  }
  return obj;
};

// Run through each item in an array, then resolve a Wait
// once all items have been iterated through.
//
//    eachWait(object, function(item, next) {
//      // do something with 'item', then do the next thing
//      next(null, 'Foo');
//    })
//    .done(function (err, someValue) {
//      console.log("Last item ran!")
//    });
//
function eachWait (obj, callback, context) {
  var len = size(obj);
  var current = 0;
  var wait = new Wait();
  context = context || obj;
  var next = function (err) {
    if (err) {
      wait.reject(err);
      return;
    }
    current += 1;
    // We're at the last item, so resolve the wait.
    if (current === len) wait.resolve();
  };
  // Run an 'each' loop
  each(obj, function (item) {
    callback.call(context, item, next);
  });
  return wait;
}

// Ensure the string ends with a backslash
function slashify (str) {
  return (str.lastIndexOf('/') !== (str.length - 1))? str + '/' : str;
}

// Wait
// ----
// This is a very stripped-down, promise-like class.

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
  this._value = null;
};

// Run a callback when done waiting. Callbacks follow
// the NodeJS convention of passing an error as the first
// argument and `value` as the second.
//
//    wait.done(function (err, value) { /*code*/ });
//
Wait.prototype.done = function(onReady){
  var self = this;
  nextTick(function(){
    if(onReady && ( "function" === typeof onReady)){
      if (self._state === 1)
        onReady.call(self, null, self._value);
      else if (self._state === -1)
        onReady.call(self, self._value);
      else
        self._onReady.push(onReady);
    }
  });
  return this;
};

// Resolve the Wait.
Wait.prototype.resolve = function(value, ctx){
  this._state = 1;
  this._dispatch(this._onReady, null, value, ctx);
  this._onReady = [];
};

// Reject the Wait.
Wait.prototype.reject = function(value, ctx){
  this._state = -1;
  value = value || new Error('Error in Wait');
  this._dispatch(this._onReady, value, null, ctx);
  this._onFailed = [];
};

// Helper to run callbacks
Wait.prototype._dispatch = function (fns, err, value, ctx) {
  this._value = (err || value);
  ctx = (ctx || this);
  var self = this;
  each(fns, function(fn){ fn.call(ctx, err, self._value); });
};

// zjs
// ===
// zjs' api is intentionally minimal, with the intent to impact
// your code as little as possible.
//
// Modules are defined and imported with module paths, which are
// dot-seperated strings like 'foo.bar' or 'app.bar.bin'. zjs
// interprets paths similarly to Java, where the last segment
// of the path is evaluated to be a JavaScript file, and the preceding
// segments the directory structure. Thus, 'app.foo.bar' will load the
// file 'app/foo/bar.js' (unless the path is mapped elsewhere: see `z.map`
// and `z.config`).
//
// Inside a script, modules are available as javascript objects that match
// a module path. There aren't any special export methods or convoluted
// namespace wrapppers to deal with, just plain javascript objects you can
// define as you'd like.
//
// Here's an example of a simple zjs module:
//
//    z.module('foo.bar');
//
//    z.imports(
//      'foo.bin',
//      'foo.bax'
//    );
//
//    foo.bar.Bin = 'bar';
//    foo.bar.Bax = foo.bin.SomeProperty + 'bax';
//
// Contrived, but you get the idea.

var z = root.z = {};

z.VERSION = "2.0.0";

// Module registry
var _modules = {};

// Namespace registry
var _namespaces = {};

// Default config options.
var _config = {
  debug: false,
  root: '',
  namespaces: {},
  maps: {
    modules: {},
    namespaces: {}
  }
};

// Set or get a configuation option. To set several options
// at once, pass an object to `key`. To get an option without
// changing its value, simply omit the `value` arg.
z.config = function (key, value) {
  if (arguments.length === 0)
    return _config;
  if ('object' === typeof key) {
    for (var item in key) {
      z.config(item, key[item]);
    }
    return _config;
  }
  if (typeof value !== 'undefined') {
    if ('map' === key) {
      each(value, function (vals, type) {
        z.map(vals, null, {type: type});
      });
    }
    _config[key] = value;
  }
  return ('undefined' !== typeof _config[key]) 
    ? _config[key] : false;
};

// Map a module to the given path.
//
//    z.map('Foo', 'libs/foo.min.js');
//    z.imports('Foo'); // -> Imports from libs/foo.min.js
//
z.map = function (mod, path, options) {
  options = options || {};
  if ('object' === typeof mod) {
    for (var key in mod) {
      z.map(key, mod[key], options);
    }
    return;
  }
  var type = options.type || 'modules';
  _config.maps[type][mod] = path;
};

// Map a namespace to the given path.
//
//    z.mapNamespace('Foo.Bin', 'libs/FooBin');
//    // The following import will now import 'lib/FooBin/Bax.js'
//    // rather then 'Foo/Bin/Bax.js'
//    z.imports('Foo.Bin.Bax');
//
z.mapNamespace = function (ns, path) {
  z.map(ns, path, {type: 'namespaces'});
};

// Creates a new module. This method creates an object based on
// the passed module path, ensuring that all segments are defined.
// It should be at the top of every zjs module.
// 
//    z.module('app.foo.bar');
//    // The module is now available as a basic javascript object.
//    app.foo.bar.Bin = function () { /* code */ };
//
z.module = function (name) {
  var cur = _modules;
  var parts = name.split('.');
  var ns = parts[0];
  z.namespace(ns);
  for (var part; parts.length && (part = parts.shift()); ) {
    if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
  return cur;
};

// Ensure a namespace exists.
z.namespace = function (name) {
  if (!_namespaces.hasOwnProperty(name))
    _namespaces[name] = true;
  if (!_modules.hasOwnProperty(name)) 
    _modules[name] = {};
  return _modules[name];
};

// Import a module or modules. Imported modules are then available for the
// current module.
//
// You can import all dependencies at once by overloading this method, or
// load them one at a time. For example:
//
//    z.imports(
//      'app.foo',
//      'app.bar'
//    );
//
// If only one argument is passed, `z.imports` will return that module. This
// can be handy if you want to alias a module for whatever reason:
//  
//    var foo = z.imports('app.long.unweildly.module.path.foo');
//
z.imports = function (/*...*/) {
  if (arguments.length === 1) {
    var name = arguments[0];
    var cur = _modules;
    var parts = name.split('.');
    for (var part; part = parts.shift(); ) {
      if(typeof cur[part] !== "undefined"){
        cur = cur[part];
      } else {
        return null;
      }
    }
    return cur;  
  }
};

// Get all registered modules.
z.getModules = function () {
  return _modules;
};

// Get all registered namespaces.
z.getNamespaces = function () {
  return _namespaces;
};

// z.plugin
// --------

// Plugin registry
var _plugins = {};

// Register a plugin. Plugins can handle module loading, parsing and
// compiling. Here's an example:
//
//    z.plugin('foo.bin', {
//      handler: function (mod, next) {
//        var self = this;
//        var loader = z.Loader.getInstance();
//        loader.load(mod.src, function (err, data) {
//          self.parse(raw);
//          next();
//        }, error);
//      },
//      parse: function (raw, mod) {
//        // code
//        return raw;
//      },
//      build: function (mod, next) {
//        var build = z.Build.getInstance();
//        build.fs.readFile(mod.src, 'utf-8', function (err, raw) {
//          build.modules[mod.name] = {
//            data: raw
//          };
//          next();
//        });
//      }
//    });
//
z.plugin = function (name, options) {
  _plugins[name] = options;
};

// Get a plugin. If it isn't loaded, use z.loader to get it. If this is the zjs
// runtime (and z.loader isn't available), this will throw an error.
z.usePlugin = function (name, next) {
  if (_plugins.hasOwnProperty(name)) {
    next(_plugins[name]);
  } else if (z.Loader) {
    var loader = z.Loader.getInstance();
    mod = loader.parseModulePath(name);
    loader.requestScript(mod.src, function () {
      if (!_plugins.hasOwnProperty(name)) {
        throw new Error('No plugin found: ' + name);
        return;
      }
      z.usePlugin(name, next);
    });
  } else {
    throw new Error('No plugin found: ' + name);
  }
};

// Default plugins
// ---------------

// The default loader.
z.plugin('__module', {
  parse: function (raw, mod) {
    return z.parser.wrap(raw);
  },
  handler: function (mod, next) {
    var self = this;
    var loader = z.Loader.getInstance();
    loader.requestAJAX(mod.src, function (err, raw) {
      var deps = z.parser.getDeps(raw);
      if (deps.length > 0) {
        loader.load(deps, function () {
          var compiled = self.parse(raw, mod);
          loader.enable(compiled, mod, next);
        })
      } else {
        var compiled = self.parse(raw);
        loader.enable(compiled, mod, next);
      }
    });
  },
  build: function (mod, next) {
    var self = this;
    var loader = z.Loader.getInstance();
    var build = z.Build.getInstance();
    build.fs.readFile(mod.src, 'utf-8', function (err, raw) {
      var deps = z.parser.getDeps(raw);
      if (deps.length > 0) {
        loader.load(deps, function () {
          var compiled = self.parse(raw, mod);
          build.modules[mod.name] = {
            deps: deps,
            data: compiled
          };
          next();
        });
      } else {
        var compiled = self.parse(raw, mod);
        build.modules[mod.name] = {
          data: compiled
        };
        next();
      }
    });
  }
});

// A plugin to load unwrapped scripts.
z.plugin('shim', {
  handler: function (mod, next) {
    var loader = z.Loader.getInstance();
    loader.requestScript(mod.src, next);
  },
  build: function (mod, next) {
    var build = z.Build.getInstance();
    build.fs.readFile(mod.src, 'utf-8', function (err, raw) {
      build.extractLicenses(raw);
      build.modules[mod.name] = {
        data: raw
      };
      next();
    });
  }
});

// A plugin to load raw text files.
z.plugin('txt', {
  parse: function (raw, mod) {
    raw = "z.module('" + mod.name + "');\n"
          + mod.name + ' = "' + raw.replace(/"/g, '\"') + '";\n';
    return z.parser.wrap(raw);
  },
  handler: function (mod, next) {
    var self = this;
    var loader = z.Loader.getInstance();
    loader.requestAJAX(mod.src, function (err, data) {
      if (err) return next(err);
      var compiled = self.parse(data, mod);
      loader.enable(compiled, mod, next);
    });
  },
  build: function (mod, next) {
    var self = this;
    var build = z.Build.getInstance();
    build.fs.readFile(mod.src, 'utf-8', function (err, data) {
      var compiled = self.parse(data, mod);
      build.modules[mod.name] = {
        data: compiled
      };
      next();
    });
  }
});

// z.parser
// --------
// The parser handles module dependencies and the like.
var parser = {};

// RegExp to find an import.
var _importsMatch = /z\.imports\(([\s\S\r\n]+?)\)/g;

// RegExp to find the module name
var _moduleNameMatch = /z\.module\(([\s\S]+?)\)/g

// RegExp to cleanup module paths
var _cleanModulePath = /[\r|\n|'|"|\s]/g;

// Ensures that top-level (or root) namespaces are defined.
// For example, in `app.foo.bar` the root namespace is `app`.
// If a module-name has only one segment, like `main`, then `main`
// is the root.
function _ensureRootNamespace (name) {
  var loader = z.Loader.getInstance();
  name = loader.parseModulePath(name).name;
  var ns = (name.indexOf('.') > 0) 
    ? name.substring(0, name.indexOf('.'))
    : name;
  // z.namespace(ns);
  var namespaces = z.getNamespaces();
  if (!namespaces.hasOwnProperty(ns)) {
    namespaces[ns] = true;
  }
};

// Parse a module loaded by AJAX, using regular expressions to match
// any `z.imports` calls in the provided module. Any matches will be
// returned in an array; if no imports are found, then an empty array
// will be returned.
parser.getDeps = function (rawModule) {
  var self = this;
  var deps = [];
  var nsList = [];
  rawModule.replace(_importsMatch, function (matches, importList) {
    var imports = importList.split(',');
    each(imports, function (item) {
      item = item.replace(_cleanModulePath, "");
      _ensureRootNamespace(item)
      deps.push(item);
    });
  });
  rawModule.replace(_moduleNameMatch, function (matches, modName) {
    var item = modName.replace(_cleanModulePath, "") 
    z.module(item);
    _ensureRootNamespace(item);
  })
  return deps;
};

// Wrap a module in a function to keep it from messing with globals. This
// will also provide it with any required namespaces.
parser.wrap = function (rawModule) {
  var nsVals = [];
  var nsList = [];
  var compiled = '';
  var namespaces = z.getNamespaces();
  each(namespaces, function (val, ns) {
    nsVals.push("z.namespace('" + ns + "')");
    nsList.push(ns);
  });
  nsVals.push('z');
  nsList.push('z');

  compiled = ";(function (" + nsList.join(', ') + ") {/* <- zjs runtime */ " + rawModule + "\n})(" + nsVals.join(', ') + ");\n";
  return compiled;
};

z.parser = parser;

// z.Loader
// --------
// The Loader, as its name suggests, handles all importing
// of scripts. 
var Loader = function (options) {
  options = options || {};
  this.visited = {};
  this.options = defaults({
    // ???
  }, options);
};

// Used with 'getInstance()'
var _loaderInstance = null;

// Get a singleton instance of z.Loader. If this
// is the first time `getInstance` is called, the
// options arg will be passed to z.Loader's constructor.
Loader.getInstance = function (options) {
  if (!_loaderInstance)
    _loaderInstance = new Loader(options);
  return _loaderInstance;
}

// A simple error handler to use if a callback is not
// provided.
function _handleErr (err) {
  if (err) throw err;
};

// Check if the passed item is a path
function _isPath (obj) {
  var result = false;
  result = obj.indexOf('/') >= 0;
  if (!result)
    result = obj.indexOf('.js') >= 0;
  return result;
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
// @private
function _nameToPath (obj, options) {
  if (_isPath(obj)) {
    // This is probably already a path.
    return obj;
  }
  obj = obj.replace(/\./g, '/');
  return obj;
};

// Check z's config and map any requests that need it.
// @private
function _mapRequest (path) {
  if (_config.maps.modules.hasOwnProperty(path.name)) {
    path.src = _config.maps.modules[path.name];
    if (!_isPath(path.src)) path.src = _nameToPath(path.src) + '.js';
    return path;
  }
  each(_config.maps.namespaces, function (ns, map) {
    var match = new RegExp(map + '\\.');
    if (match.test(path.name)) {
      var item = _nameToPath(path.name.replace(match, ''));
      path.src = slashify(ns) + item + '.js';
      // Break the loop.
      return true;
    }
  });
  return path;
};

// Make sure the module path is converted into a uri.
Loader.prototype.parseModulePath = function (req) {
  var root = z.config('root');
  var path = {name:'', src:'', plugin: '__module'};
  var parts = req.split(':');
  if (parts.length > 1) {
    path.plugin = parts[0].trim();
    req = parts[1].trim();
  }
  if (_isPath(req)) {
    path.name = _pathToName(req, {stripExt:true});
    path.src = req;
  } else {
    path.name = req;
    path.src = _nameToPath(req) + '.js';
  }
  path = _mapRequest(path);
  // Add root.
  path.src = root + path.src;
  return path;
};

Loader.prototype.load = function (path, next) {
  var self = this;
  next = next || _handleErr;

  if (path instanceof Array) {
    eachWait(path, function (item, next) {
      self.load(item, next);
    })
    .done(function (err) {
      if (err) {
        next(err);
        return;
      }
      next();
    });
    return;
  }

  var mod = this.parseModulePath(path);
  var self = this;

  // If we can import this module, it's already been enabled.
  if (mod.name && !!z.imports(mod.name)){
    next();
    return;
  }

  z.usePlugin((mod.plugin || '__module'), function (plugin) {
    if (z.config('building')) {
      plugin.build(mod, next);
    } else {
      plugin.handler(mod, next);
    }
  });
};

// Create a new script node (without inserting it into the DOM).
function _newScript (moduleName) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  if (moduleName)
    script.setAttribute('data-module', moduleName);
  return script;
};

// Place a script in the DOM
function _insertScript(script, next) {
  var head = document.getElementsByTagName("head")[0] || document.documentElement;
  try {
    head.insertBefore(script, head.firstChild).parentNode;
  } catch (e) {
    console.log('caught:', e);
  }
  if (next) {
    // If a callback is provided, use an event listener.
    var done = false;
    script.onload = script.onreadystatechange = function() {
      if (!done && (!this.readyState ||
          this.readyState === "loaded" || this.readyState === "complete") ) {
        done = true;
        next();
        // Handle memory leak in IE
        script.onload = script.onreadystatechange = null;
      }
    };
  }
};

// Add a script to the page.
function _addScript (mod, text, next) {

  // add a sourceURL to help with debugging
  text += '\n//# sourceURL=' + mod.src;

  var script = _newScript(mod.name);
  var done = false;

  // We don't get useful line numbers if we just let the 
  // browser handle syntax errors, so we need to use the following code.
  // @todo: Firefox seems to get a line-number one less then it should be.
  var oldErr = window.onerror || null;
  window.onerror = function (errorMsg, url, lineNumber) {
    if (errorMsg.indexOf('SyntaxError') >= 0) {
      var message = errorMsg + '\n\tEvaluating [' + mod.name + '] on line ' + lineNumber;
      if (oldErr) return oldErr(message, url, lineNumber);
      console.error(message);
      return true;
    }
    // Otherwise, it's fine to let the browser handle runtime errors.
    return oldErr? oldErr(errorMsg, url, lineNumber) : false;
  };

  script.appendChild(document.createTextNode(text));
  _insertScript(script);

  // Rebind the old error handler.
  window.onerror = oldErr;

  next();
};

// Send an AJAX request.
Loader.prototype.requestAJAX = function (src, next) {
  var visited = this.visited;
  if(visited.hasOwnProperty(src)){
    visited[src].done(next);
    return;
  }
  visited[src] = new Wait();
  visited[src].done(next);

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
        visited[src].reject('AJAX Error: Could not load [' + src + '], status code: ' + this.status);
      }
    }
  }

  request.open('GET', src, true);
  request.send();
};

// Load a script by placing it in the DOM
Loader.prototype.requestScript = function (src, next) {
  var visited = this.visited;
  if(visited.hasOwnProperty(src)){
    visited[src].done(next);
    return;
  }

  visited[src] = new Wait();
  visited[src].done(next);

  var script = _newScript();
  script.src = src;
  script.async = true;
  _insertScript(script, function () {
    visited[src].resolve();
  });
};

// Take a raw module string and place it into the DOM as a `<script>`.
// This will only be run after any dependencies have been loaded first.
Loader.prototype.enable = function (compiled, mod, next) {
  next = next || _handleErr;
  _addScript(mod, compiled, next);
};

z.Loader = Loader;

// Start a script by loading a main file. Please note that,
// due to the way zjs loads scripts, z.config won't work
// if you place it in your main module. Use `z.start.config`
// if your app needs configuration. However, zjs will try
// to parse the root path from the main module, which
// often is all you need.
z.start = function (mainFile, done) {
  var lastSegment = (mainFile.lastIndexOf('/') + 1);
  var root = mainFile.substring(0, lastSegment);
  var main = mainFile.substring(lastSegment);
  z.config('root', root);
  z.config('main', main);
  var loader = z.Loader.getInstance();
  loader.load(main, done);
};

// Start a script by loading a config file. At the very
// minimum, you'll need the following:

//    z.config({
//      root: 'scripts/'
//      main: 'app.main'
//      // You can also map modules and namespaces
//      // here, if you need to.
//      maps: {
//        modules: {
//          'foo' : 'libs/foo/foo.js'
//        }
//      }
//    });

// By convention, this file is nammed 'config.js', but you can
// call it whatever you'd like.
z.startConfig = function (configFile, done) {
  var loader = z.Loader.getInstance();
  configFile = configFile + '.js';
  loader.requestScript(configFile, function () {
    if (z.config('main'))
      loader.load(z.config('main'), done);
  });
};

// If this script tag has 'data-main' or 'data-config' attribues, we can
// autostart without the need to explicitly call 'z.start'.
function _autostart() {
  var scripts = document.getElementsByTagName( 'script' );
  var script = scripts[ scripts.length - 1 ];
  if (script) {
    var main = script.getAttribute('data-main');
    var config = script.getAttribute('data-config');
    if (main) {
      z.start(main);
    } else if (config) {
      z.startConfig(config);
    }
  }
};

if (typeof document !== 'undefined')
  _autostart();

}));