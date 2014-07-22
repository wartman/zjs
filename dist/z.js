/*!
  zjs 2.0.0

  Copyright 2014
  Released under the MIT license

  Date: 2014-07-22T16:02Z
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

z.env = {
  modules: {},
  namespaces: {}
};

// Z's config (private: use z.config to get values)
var _config = {
  debug: false,
  root: '',
  maps: {
    modules: {},
    namespaces: {}
  }
};

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
  if (typeof value !== 'undefined') {
    if ('map' === key) return z.map(value);
    if ('namespaces' === key) return z.mapNamespace(value);
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
// Note that this method will automatically work with any 
// script that exports a global var, so long as `mod` is 
// equal to the global you want. Here is an example for jQuery:
//
//    z.map('$', 'libs/jQuery.min.js')
//
z.map = function (mod, path) {
  if ('object' === typeof mod) {
    for (var key in mod) {
      z.map(key, mod[key]);
    }
    return;
  }
  _config.maps.modules[mod] = path;
};

// Map a namespace to the given path.

//    z.mapNamespace('Foo.Bin', 'libs/FooBin');
//    // The following import will now import 'lib/FooBin/Bax.js'
//    // rather then 'Foo/Bin/Bax.js'
//    z.imports('Foo.Bin.Bax');

z.mapNamespace = function (ns, path) {
  if ('object' === typeof ns) {
    for (var key in ns) {
      z.mapNamespace(key, ns[key]);
    }
    return;
  }
  _config.maps.namespaces[ns] = path;
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
  var cur = z.env.modules;
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
  if (!z.env.namespaces.hasOwnProperty(name))
    z.env.namespaces[name] = true;
  if (!z.env.modules.hasOwnProperty(name)) 
    z.env.modules[name] = {};
  return z.env.modules[name];
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
    var cur = z.env.modules;
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
// z.loader
// ----------
// The loader, as its name suggests, handles all importing
// of scripts. In order to load modules correctly, the loader
// uses AJAX to load the script, then investigates it for any
// dependencies (registered with `z.imports`). The loader will 
// create a `<script>` tag once all dependencies are loaded and 
// insert the module there.
var loader = {};

// A list of visited scripts, used to ensure that things are only
// requested once.
loader.visited = {};

// A simple error handler to use if a callback is not
// provided.
function _handleErr (err) {
  if (err) throw err;
};

// Load a module via AJAX. This method will also try to parse
// the script and gather any aditional imports that are
// defined there. `next` will be called when the module is ready,
// NOT when the raw file is loaded. NodeJs callback conventions are
// followed here, and, if an error occours, `next` will be called 
// with an error as the first argument (or 'null' if all is well).
// The second argument is the next callback in the current stack
// (or `null` if we're at the end of the stack).
//
//    loader.load('app.foo', function (err, next) { /* code */ });
//
// If 'path' is an array, the loader will load each item in turn,
// then fire 'next' when all items are complete.
//
//    loader.load(['app.foo', 'app.bar'], function (err, next) { /* code */ });
//
loader.load = function (path, next) {
  next = next || _handleErr;

  if (path instanceof Array) {
    eachWait(path, function (item, next) {
      loader.load(item, next);
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

  this.request(mod.src, function (err, raw) {
    if (err) {
      next(err);
      return;
    }
    var deps = self.parse(raw);
    if (deps.length) {
      loader.load(deps, function (err) {
        if (err) {
          next(err);
          return;
        }
        self.enable(raw, mod, next);
      });
    } else {
      self.enable(raw, mod, next);
    }
  });
};

// Check if the passed item is a path
// @private
function _isPath (obj) {
  var result = false;
  result = obj.indexOf('/') >= 0;
  if (!result)
    result = obj.indexOf('.js') >= 0;
  return result;
};

// Convert a path into an object name
// @private
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
loader.parseModulePath = function (req) {
  var root = z.config('root');
  var path = {name:'', src:''};
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

// Load using NodeJs
loader.require = function (src, next) {
  require(src);
  next();
};

// Send an AJAX request.
loader.request = function (src, next) {
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
}

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
  var ns = (name.indexOf('.') > 0) 
    ? name.substring(0, name.indexOf('.'))
    : name;
  if (!z.env.namespaces.hasOwnProperty(ns)) {
    z.env.namespaces[ns] = true;
  }
};

// Parse a module loaded by AJAX, using regular expressions to match
// any `z.imports` calls in the provided module. Any matches will be
// returned in an array; if no imports are found, then an empty array
// will be returned.
loader.parse = function (rawModule) {
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
// Can't get this to display useful debug info: may force me to give up :P
function _addScript (mod, text, next) {

  // add a sourceURL to help with debugging
  text += '\n//# sourceURL=' + mod.src;

  var script = _newScript(mod.name);
  var done = false;

  // We don't get useful line numbers if we just let the browser handle syntax errors,
  // so we need to use the following code.
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

loader.wrap = function (rawModule) {
  var nsVals = [];
  var nsList = [];
  var compiled = '';
  each(z.env.namespaces, function (val, ns) {
    nsVals.push("z.namespace('" + ns + "')");
    nsList.push(ns);
  });
  nsVals.push('z');
  nsList.push('z');

  compiled = ";(function (" + nsList.join(', ') + ") {/* <- zjs runtime */ " + rawModule + "\n})(" + nsVals.join(', ') + ");\n";
  return compiled;
};

// Take a raw module string and place it into the DOM as a `<script>`.
// This will only be run after any dependencies have been loaded first.
loader.enable = function (rawModule, mod, next) {
  next = next || _handleErr;
  var compiled = this.wrap(rawModule);
  _addScript(mod, compiled, next);
};

// Load a script by placing it in the DOM
loader.getScript = function (src, next) {
  var script = _newScript();
  script.src = src;
  script.async = true;
  _insertScript(script, next);
};

z.loader = loader;

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
  z.loader.load(main, done);
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
  configFile = configFile + '.js';
  z.loader.getScript(configFile, function () {
    if (z.config('main'))
      z.loader.load(z.config('main'), done);
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