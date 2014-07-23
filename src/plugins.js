// Plugins
// -------

// The default loader.
z.plugin('__module', {
  parse: function (raw, mod) {
    return z.parser.wrap(raw);
  },
  handler: function (mod, next) {
    var self = this;
    z.loader.requestAJAX(mod.src, function (err, raw) {
      var deps = z.parser.getDeps(raw);
      if (deps.length > 0) {
        z.loader.load(deps, function () {
          var compiled = self.parse(raw, mod);
          z.loader.enable(compiled, mod, next);
        })
      } else {
        var compiled = self.parse(raw);
        z.loader.enable(compiled, mod, next);
      }
    });
  },
  build: function (mod, next) {
    var self = this;
    z.build.fs.readFile(mod.src, 'utf-8', function (err, raw) {
      var deps = z.parser.getDeps(raw);
      if (deps.length > 0) {
        z.loader.load(deps, function () {
          var compiled = self.parse(raw, mod);
          z.build.modules[mod.name] = {
            deps: deps,
            data: compiled
          };
          next();
        });
      } else {
        var compiled = self.parse(raw, mod);
        z.build.modules[mod.name] = {
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
    z.loader.requestScript(mod.src, next);
  },
  build: function (mod, next) {
    z.build.fs.readFile(mod.src, 'utf-8', function (err, raw) {
      z.build.extractLicenses(raw);
      z.build.modules[mod.name] = {
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
    z.loader.requestAJAX(mod.src, function (err, data) {
      if (err) return next(err);
      var compiled = self.parse(data, mod);
      z.loader.enable(compiled, mod, next);
    });
  },
  build: function (mod, next) {
    var self = this;
    z.build.fs.readFile(mod.src, 'utf-8', function (err, data) {
      var compiled = self.parse(data, mod);
      z.build.modules[mod.name] = {
        data: compiled
      };
      next();
    });
  }
});