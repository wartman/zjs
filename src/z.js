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
