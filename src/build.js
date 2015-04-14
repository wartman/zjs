// DEPRECIATE
// This will not longer work.

/**
 * zjs builder
 *
 * Copyright 2014
 * Released under the MIT license
 */

var z        = require('./z');
var sorter   = require('./sorter');
var fs       = require('fs');
var UglifyJS = require("uglify-js");
var _        = require('lodash');

/**
 * The zjs builder.
 */
var Build = function (options) {
  this.options = {
    dest: false,
    main: 'main',
    names: {
      global: '__global__',
      exports: '__exports__'
    }
  };

  this.setup(options);
  this.loaders(); // Register loaders.

  this._shimmed = {};
  this._exists = {};
  this._progressLog = '';
  this._compiled = '';
  this._header = '';
  this._onDone = function(){};
};

/**
 * Setup Build.
 *
 * @param {Object} options
 */
Build.prototype.setup = function(options){
  this.options = _.defaults(this.options, options);
};

/**
 * Compile the project and output.
 */
Build.prototype.render = function () {

  var modules = z.env.modules;
  var moduleList = {};
  var sortedModules = [];
  var compiled = '';
  var self = this;

  compiled += "/* namespaces */\n";
  _.each(z.env.namespaces, function(val, ns){
    compiled += self.renderNamespace(ns);
  });

  compiled += "\n/* modules */\n";

  // Ensure that modules dependent on other modules are always defined
  // lower down in the compiled script.
  for (item in modules) {
    if (item.indexOf('@') >= 0) {
      var item = item.replace(/@shim\./g, '');
      if (z.settings.shim[item]) {
        var shim = z.settings.shim[item]
        moduleList[item] = shim.imports || [];
      }
      continue;
    }
    moduleList[item] = modules[item]._imports;
  }

  // Sort the modules with the topological sorter.
  sortedModules = sorter(moduleList, this.options.main);

  // Compile
  _.each(sortedModules, function (ns) {
    if(ns.indexOf('@') >= 0) return; // Don't add shims.
    ns = z.getMappedObj(ns);
    compiled += self.renderModule( modules[ns], ns );
  });

  // Wrap the compiled item, replacing 'z.global' with the global var.
  compiled = "(function () {\nvar " + this.options.names.global + " = this;\n" + compiled.replace(/z\.global/g, this.options.names.global) + "\n}).call(this);";

  if(this.options.optimize){
    compiled = UglifyJS.minify(compiled, {fromString: true}).code;
    // Add license headers.
    compiled = this._header + compiled;
  }

  if(this.options.dest){
    fs.writeFileSync(this.options.dest, compiled);
  }

  this._compiled = compiled;
  return compiled;
};

/**
 * Render a module.
 *
 * @param {Function} factory
 * @param {String} namespace
 */
Build.prototype.renderModule = function (module, namespace) {
  if (z.settings.shim[namespace]) {
    this.logProgress(true);
    this.extractLicenses(z.getObjectByName(namespace, z.global));
    return z.getObjectByName(namespace, z.global) + '\n';
  }
  var header = 'var ' + exportsName + ' = {};\n';
  var body = '';
  var exportsName = this.options.names.exports;
  _.each(module._exports, function (item) {
    if (item.id) {
      if (_.isFunction(item.definition)) {
        body += exportsName + '.' + item.id + ' = (' + item.definition.toString() + ')();\n';
      } else {
        body += exportsName + '.' + item.id + ' = ' + item.definition + '\n';
      }
    } else {
      if (_.isFunction(item.definition)) {
        header = 'var ' + exportsName + ' = (' + item.definition.toString() + ')();\n';
      } else {
        header = exportsName + '.' + item.id + ' = ' + item.definition + '\n';
      }
    }
  });
  if (module._body) {
    header = 'var __exports__ = (' + module._body.toString() + ')();\n'
  }
  this.logProgress(true);
  return namespace + ' = (function () {\n' + header + body + 'return ' + exportsName + ';\n})();\n';
};

/**
 * Render a namespace, ensuring all namespaces are defined.
 *
 * @param {String} namespace
 */
Build.prototype.renderNamespace = function (namespace) {
  var cur = '';
  var render = '';
  var parts = namespace.split('.');
  var exists = this._exists[parts[0]];

  if (!exists) {
    render += "var " + parts[0] + ' = ' + this.options.names.global + '.' + parts[0] + ' = {};\n';
    exists = this._exists[parts[0]] = {};
  }

  cur = parts.shift();

  for (var part; parts.length && (part = parts.shift()); ) {
    cur = cur + '.' + part;
    if (exists[part]) {
      exists = exists[part];
    } else {
      exists = exists[part] = {};
      render += cur + ' = {};\n';
    }
  }

  return render;
};

/**
 * Try to extract license info from included modules.
 */
var licenseMatch = /\/\*\![\s\S]+?\*\//g;
Build.prototype.extractLicenses = function (file) {
  var matches = licenseMatch.exec(file);
  if (!matches) return;
  this._header += matches[0] + '\n\n';
};

/**
 * Log the current state of the builder.
 *
 * @param {Boolean} good Set to true to log a good state.
 */
Build.prototype.logProgress = function (good) {
  this._progressLog += (good)? '.' : 'x';
  var stream = process.stdout;
  var str = this._progressLog;
  process.nextTick(function () {
    stream.clearLine();
    stream.cursorTo(0);
    stream.write(str);
  });
};

Build.prototype.loaders = function () {

  /**
   * Loader that replaces the default.
   */
  z.load = function (module, next, error) {
    
    var src = z.getMappedPath(module, process.cwd() + '/' + z.config('root'));
    var file = fs.readFileSync(src, 'utf-8');

    if (z.settings.shim[module]) {
      z.createObjectByName(module, file, z.global);
      next();
      return;
    };

    var zModule = Function('z', file);
    zModule(z);

    if (z.getObjectByName(module)) {
      z.env.modules[module].done(next, error);
    }
  };

  z.file = function (module, next, error) {
    var src = z.getMappedPath(module, process.cwd() + '/' + z.config('root'));
    var file = fs.readFileSync(src, 'utf-8');
    next(file);
  };

  // Overwrite default plugin
  z.plugin('txt', function (module, next, error) {
    var moduleName = z.getMappedObj(module);
    z.file(module, function (file) {
      var fileWrapper = z(moduleName);
      fileWrapper.exports(Function('', '  return \'' + file + '\''));
      fileWrapper.done(next, error);
    }, error);
  });

};

/**
 * Start compiling the project.
 *
 * @param {String} src
 * @param {String} dest
 */
Build.prototype.start = function (src, dest) {

  var file = fs.readFileSync(src, 'utf-8');
  var self = this;

  this.options.dest = (dest || false);

  if (this.options.buildfile) {
    var buildz = JSON.parse(fs.readFileSync(src), 'utf-8');
    src = buildz.src + '.js';
    dest = buildz.dest;
    this.setup(buildz.options);
  }

  if (!dest) dest = this.options.dest || false;
  if (!dest) {
    throw Error ('No destination file specified.');
    return;
  }

  this.extractLicenses(file);
  var zModule = Function('z', file);
  zModule(z);

  this.options.main = (z.config('main') || this.options.main);

  z.env.modules[this.options.main].done( function renderModule () {
    self.render();
    self._onDone();
    process.nextTick(function () {
      console.log('\n');
    })
  });

  return this;
};

/**
 * Run when compiling is done.
 */
Build.prototype.done = function (next) {
  var self = this;
  this._onDone = function(){
    next.apply(self, arguments);
  }

  return this;
};

module.exports = Build;