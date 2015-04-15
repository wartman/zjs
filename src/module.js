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
