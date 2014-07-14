var Module = function (name, factory) {
  this.factory = factory;
  this.deps = this.findDeps();
  this.wait = new Wait();
  this.isPending = true;
  this.isDisabled = false;
  this.isEnabled = false;
  this.isEnabling = false;
  // Ensure the name is available.
  this.define(name);
};

var _importCheck = /z\.import\(['|"]([\s\S]+?)['|"]\)/g;
var _depCheck = /([a-zA-Z0-9\.]+)/g;
// Plugins are defined with the syntax: 'plugin.name: module.name'
var _pluginCheck = /([a-zA-Z0-9\.]+)\s*?:\s*?([a-zA-Z0-9\.]+)/g;

Module.prototype.define = function (name) {
  ensureNamespace(name);
  createObjectByName(name);
};

Module.prototype.findDeps = function () {
  var factory = this.factory.toString();
  var deps = [];
  var matches = [];
  var match;
  while ( match = factory.match(_importCheck) ){
    match.shift();
    matches.push(match);
  }
  each(matches, function (item) {
    var parts = item.match(_depCheck);
    each(parts, function (dep) {
      var plugin = dep.match(_pluginCheck);
      if (plugin) {
        deps.push({
          id: plugin.pop(),
          plugin: plugin.pop()
        });
        return;
      }
      deps.push({
        id: dep
      });
    })
  })
  return deps;
};

Module.prototype.enable = function () {
  if (this.isDisabled || this.isEnabling) return;
  if (this.isEnabled) {
    this.wait.resolve();
    return;
  }

  var queue = [];
  var self = this;

  each(this.deps, function (item) {
    if (item.imported === true || !!getObjectByName(item.id)) return;
    item.imported = true;
    queue.push(item);
  });

  if (queue.length > 0) {

    this.isEnabling = true;
    eachWait(queue, function getImports (item, next, error) {
      // Wait for a package to load its deps before continuing,
      // and ensure that an object is defined before continuing.
      var check = function () {
        var name = item.id;
        if (isPath(name)) name = getObjectByPath(name, {stripExt:true});
        if (z.env.modules.hasOwnProperty(name)) {
          z.env.modules[name].done(next, error);
        } else {
          if (getObjectByName(name)) {
            next();
          } else {
            error('A dependency was not loaded: ' + name);
          }
        }
      };
      // Load the item, either with a plugin or the default method.
      if (item.plugin) {
        if ('function' === typeof item.plugin) {
          item.plugin(item.id, check, error);
        } else {
          z.plugin(item.plugin, item.id, check, error);
        }
      } else {
        z.load(item.id, check, error);
      }
    })
    .done(function () {
      self.runFactory();
    }, function (reason) {
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
  try {
    this.factory();
    this.isEnabled = true;
    this.wait.resolve();
    delete this.factory;
  } catch (e) {
    this.disable(e);
  }
};

Module.prototype.disable = function (e) {
  if (e instanceof Error) throw e;
  this.isDisabled = true;
  this.wait.reject(e);
};