/**
 * zjs builder
 *
 * Copyright 2014
 * Released under the MIT license
 */

var zFactory = require('../../dist/z');
var fs       = require('fs');
var UglifyJS = require("uglify-js");
var _        = require('lodash');

/**
 * The zjs builder.
 */
var Build = function (options) {

  if ( !(this instanceof Build) ){
    return new Build(options);
  }

  var self = this;

  this.setup(options);

  // Mock a global env for z.
  this._global = {};
  this._global.Z_MODULE_LOADER = this.loader.bind(this);
  this._global.Z_FILE_LOADER = this.loader.bind(this);

  // Bind a copy of z to the mocked up env.
  zFactory(this._global);
  this._z = this._global.z;

  this._z.config('environment', 'node');

  this._z.plugin('txt', function (module, next, error) {
    var src = self._z.getMappedPath(module);
    if(!src){
      src =  module.replace(/\./g, '/') + '.txt';
    }
    var file = fs.readFileSync( process.cwd() + '/' + self._z.env.root + src, 'utf-8');

    var fileWrapper = self._z(module);
    fileWrapper._factory = Function('', '  this.exports = \'' + file + '\'');

    next();
    return;
  })

  this._exists = {};
  this._compiled = '';
  this._onDone = function(){};
}

/**
 * Setup Build.
 *
 * @param {Object} options
 */
Build.prototype.setup = function(options){
  this.options = _.defaults(this.options, options);
}

/**
 * Default options.
 */
Build.prototype.options = {
  dest: false,
  main: 'main'
};

/**
 * Compile the project and output.
 */
Build.prototype.render = function () {
  var modules = this._z.env.modules
    , sortedModules = []
    , compiled = ''
    , self = this;

  compiled += "/* namespaces */\n";
  _.each(this._z.env.namespaces, function(val, ns){
    compiled += self.renderNamespace(ns);
  });

  compiled += "\n/* modules */\n";

  // Ensure that modules dependent on other modules are always defined
  // lower down in the compiled script.
  for (item in modules) {
    sortedModules.push(item);
  }
  sortedModules = sortedModules.sort( function moduleSorter (a, b) {
    if(modules[a]._dependencies.hasOwnProperty(b)){
      return -1;
    }
    return 1;
  });

  _.each(sortedModules, function(ns){
    compiled += self.renderModule( modules[ns]._factory, ns );
  });

  compiled = "(function (global) {\n" + compiled + "\n})(this);"

  if(this.options.optimize){
    compiled = UglifyJS.minify(compiled, {fromString: true}).code;
  }

  if(this.options.dest){
    fs.writeFileSync(this.options.dest, compiled);
  }

  this._compiled = compiled;
  return compiled;
}

/**
 * Render a module.
 *
 * @param {Function} factory
 * @param {String} namespace
 */
Build.prototype.renderModule = function (factory, namespace) {
  if ( /this\.exports/.test(factory) ){
    var render = '';
    if (!this._exists['exporter'] ) {
      render += 'var exporter;\n';
      this._exists['exporter'] = true;
    }
    render += ';(' + factory + ').call( exporter = {} );\n';
    render += 'global.' + namespace + ' = exporter.exports;\n'
    return render;
  }
  if (this._z.env.shim[namespace]) {
    return factory + '\n';
  }
  return ";(" + factory + ').call( global.' + namespace + ' = {} );\n';
}

/**
 * Render a namespace, ensuring all namespaces are defined.
 *
 * @param {String} namespace
 */
Build.prototype.renderNamespace = function (namespace) {
  var cur = 'global'
    , render = ''
    , exists = this._exists
    , parts = namespace.split('.');

  if (!exists[parts[0]]) {
    render += "var " + parts[0] + ' = global.' + parts[0] + ' = {};\n';
    exists[parts[0]] = ( exists[parts[0]] || {} );
  }

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
}

/**
 * Loader that replaces the default.
 */
Build.prototype.loader = function (module, next, error) {

  var src = this._z.getMappedPath(module);

  if(!src){
    src = module.replace(/\./g, '/') + '.js';
  }
  
  src = process.cwd() + '/' + this._z.env.root + src;

  var file = fs.readFileSync(src, 'utf-8');

  if (this._z.env.shim[module]) {
    var shimmed = this._z(module);
    shimmed._factory = file;
    return;
  }

  var zModule = Function('z', file);
  zModule(this._z);

  this._z.env.modules[module].done(next, error);
}

/**
 * Start compiling the project.
 *
 * @param {String} src
 * @param {String} dest
 */
Build.prototype.start = function (src, dest) {

  var file = fs.readFileSync(src, 'utf-8')
    , self = this;

  this.options.dest = (dest || false);

  if (this.options.buildfile) {
    var buildz = JSON.parse(fs.readFileSync(src), 'utf-8');
    src = buildz.main + '.js';
    dest = buildz.dest;
    this.setup(buildz.options);
  }

  var zModule = Function('z', file);
  zModule(this._z);

  this.options.main = (this._z.config('main') || this.options.main);

  this._z.env.modules[this.options.main].done( function renderModule () {
    self.render();
    self._onDone();
  });

  return this;
}

/**
 * Run when compiling is done.
 */
Build.prototype.done = function (next) {
  var self = this;
  this._onDone = function(){
    next.apply(self, arguments);
  }

  return this;
}

module.exports = Build;