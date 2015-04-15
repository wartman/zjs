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
    factory(module.exports);
  } else {
    factory(window);
  }
}(function (root, undefined) {

// Create a namespace path, ensuring that every level is defined
var ensureNamespaceExists = function (namespace, exports, env) {
  var cur = env || root;
  var parts = namespace.split('.');
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

// Module
// ------
// Creates a new module 
var Module = function (z, namespace, options) {
  if (!options) options = {};
  this._z = z;
  this._state = Module.STATES.PENDING;
  this._namespace = namespace;
  this._dependencies = [];
  this._onReadyListeners = [];
  this._onFailedListeners = [];
  this.options = options; // to do: handle defaults.
  this._factory = function () {};

  // Ensure the namespace exists.
  // @todo: make configurable?
  ensureNamespaceExists(this._namespace, {});
};

Module.STATES = {
  DISABLED: -1,
  PENDING: 0,
  ENABLING: 1,
  READY: 2
};

// Define dependencies this module needs.
Module.prototype.imports = function (/* ...deps */) {
  var deps = Array.prototype.slice.call(arguments, 0);
  this._dependencies = this._dependencies.concat(deps);
  return this;
};

// The body of the module. Run once all dependencies are
// available.
Module.prototype.define = function (factory) {
  this._factory = factory;
  this.enable();
  return this;
};

Module.prototype.onReady = function (fn) {
  if (this._state === Module.STATES.READY) {
    fn();
    if (this._onReadyListeners.length) 
      this._dispatchListeners(this._onReadyListeners);
    return this;
  }
  this._onReadyListeners.push(fn);
  return this;
};

Module.prototype.onFailed = function (fn) {
  if (this._state === Module.STATES.DISABLED) {
    fn();
    if (this._onFailedListeners.length)
      this._dispatchListeners(this._onFailedListeners);
    return this;
  }
  this._onFailedListeners.push(fn);
  return this;
};

Module.prototype._dispatchListeners = function (listeners) {
  var cb;
  while (cb = listeners.pop()) {
    cb();
  }
  return this;
};

Module.prototype.enable = function () {
  if (this._state !== Module.STATES.PENDING) return this;
  this._state = Module.STATES.ENABLING;
  if (!this._dependencies.length) {
    this._factory();
    this._state = Module.STATES.READY;
    this._dispatchListeners(this._onReadyListeners);
  } else {
    this._z.loadModules(this._dependencies, function (err) {
      console.log(err);
      if (err) {
        this._state = Module.STATES.DISABLED;
        this._dispatchListeners(this._onFailedListeners);
        return;
      }
      this._factory();
      this._state = Module.STATES.READY;
      this._dispatchListeners(this._onReadyListeners);
    }, this);
  }
  return this;
};

// Loader
// ------
// Loads modules using the `<scripts>` tag.
var Loader = function () {
  this._visited = {}; 
};

// Get a visit if one exists
Loader.prototype.getVisit = function(pathName) {
  return this._visited[pathName];
};

// Add a visit
Loader.prototype.addVisit = function(pathName, cb) {
  this._visited[pathName] = true;
  return this;
};

Loader.prototype.createScriptTag = function (scriptPath) {
  var script = document.createElement("script");
  script.type = 'text/javascript';
  script.charset = 'utf-8';
  script.async = true;
  script.setAttribute('data-is-zjs-module', 'true');
  script.src = scriptPath + '.js';
  return script;
};

Loader.prototype.insertScript = function (script, next) {
  var head = document.getElementsByTagName("head")[0] || document.documentElement;
  var done = false;
  script.onload = script.onreadystatechange = function () {
    console.log('onLoad triggered');
    if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
      done = true;
      // First arg === error, second should be this script's `src`
      next(null, script.src);
      // Handle memory leak in IE
      script.onload = script.onreadystatechange = null;
    }
  };
  head.insertBefore(script, head.firstChild).parentNode;
};

Loader.prototype.load = function(pathName, next) {
  var _this = this;
  if (this.getVisit(pathName)) {
    next(null, pathName);
    return this;
  }
  this.addVisit(pathName);
  var script = this.createScriptTag(pathName);
  this.insertScript(script, next);
  return this;
};

// Z
// -
// Handles all module relationships.
var Z = function (config, loader) {
  // Configuration settings.
  this.config = {
    root: '.', // Load relative to the calling file
    env: 'production'
  };
  this._modules = {};
  this._loader = loader;
  if (!loader) this._loader = new Loader();
  // The current version.
  this.version = '@VERSION';
  // Setup user-provided configuration.
  if (config) this.setConfig(config);
};

// Set a config option or options.
Z.prototype.setConfig = function (key, value) {
  var attrs = key;
  if (typeof key !== 'object') {
    attrs = {};
    attrs[key] = value;
  }
  for (key in attrs) {
    if (attrs.hasOwnProperty(key))
      this.config[key] = attrs[key];
  }
  return this;
};

Z.prototype.setLoader = function(loader) {
  this._loader = loader;
  return this;
};

Z.prototype.getLoader = function() {
  return this._loader;
};

Z.prototype.getModule = function (namespace) {
  return this._modules[namespace];
};

// Create a new module using the provided namespace.
Z.prototype.module = function (namespace) {
  var module = new Module(this, namespace);
  this._modules[namespace] = module;
  return module;
};

// Load all requested modules, then run the callback.
Z.prototype.loadModules = function (deps, next, context) {
  console.log('loading', deps);
  var rootPath = this.config.root;
  var progress = deps.length;
  var _this = this;
  if (!next) next = function () {};
  // Keep running until `progress` is 0.
  var onReady = function (err) {
    if (err) {
      next.call(context, err);
      return
    }
    progress -= 1;
    console.log('progress:', progress);
    if (progress <= 0) next.call(context, null);
  };
  var onFailed = function (err) {
    next.call(context, err);
  };
  deps.forEach(function (dep) {
    var depPath = dep.split('.');
    depPath.unshift(rootPath);
    var fullPath = depPath.join('/');
    console.log(fullPath);
    var mod = this._modules[dep];
    if (mod) {
      mod.onReady(onReady);
    } else {
      this._loader.load(fullPath, function (err) {
        if (err) throw err;
        mod = _this._modules[dep];
        if (!mod) {
          onReady(new Error('No module loaded for path ' + fullPath));
          return;
        }
        mod.onReady(onReady);
      });
    }
  }, this);
};

// Load the first modules via the 'data-main' attribute.
Z.prototype.autostart = function () {
  if (this._autostartRan === true) return;
  if (typeof document === 'undefined') return;
  this._autostartRan = true;
  var scripts = document.getElementsByTagName('script');
  var script = scripts[scripts.length - 1];
  if (script) {
    var main = script.getAttribute('data-main');
    if (main) z.loadModules([main]);
  }
};

// Export the default instance. If the global object `Z_CONFIG`
// exists it will be used to setup the instance.
if (!root.z) {
  var usrConfig = (root.Z_CONFIG || {});
  root.z = new Z(usrConfig, new Loader());
  // Helper to create a new instance of Z.
  root.z.createScope = function (config, loader) {
    return new Z(config, loader);
  };
  // Allow users to leave the 'z.' off module declarations.
  if (!usrConfig.dontCreateModuleShortcut) 
    root.module = root.z.module.bind(root.z);
  root.z.autostart();
}

}));