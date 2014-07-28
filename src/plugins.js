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