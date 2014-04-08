/**
 * zjs builder
 *
 * Copyright 2014
 * Released under the MIT license
 */

var zFactory = require('../z');
var fs       = require('fs');
var UglifyJS = require("uglify-js");
var _        = require('lodash');

var Build = function ( src, dest, options ) {

  if ( !(this instanceof Build) ){
    return new Build(src, dest, options);
  }

  var self = this;

  this.options = _.defaults(this.options, options);
  this.options.dest = (dest || false);

  // Mock a global env for z.
  this._global = {};
  this._global.Z_MODULE_LOADER = this.loader.bind(this);

  // Bind a copy of z to the mocked up env.
  zFactory(this._global);
  this._z = this._global.z;
  this._z.set('environment', 'node');

  this._exists = {};
  this._compiled = '';
  this._onDone = function(){};

  // Start the app.
  this.start(src);
}

Build.prototype.options = {
  dest: false,
  mainNamespace: 'main'
};

Build.prototype.render = function () {
  var modules = this._z.env.modules
    , sortedModules = []
    , compiled = ''
    , self = this;

  compiled += "/* namespaces */\n";
  _.each(modules, function(val, ns){
    compiled += self.renderNamespace(ns);
  });

  compiled += "\n/* modules */\n";

  // Ensure that modules dependent on other modules are always defined
  // lower down in the compiled script.
  for (item in modules) {
    sortedModules.push(item);
  }
  sortedModules = sortedModules.sort( function moduleSorter ( a, b ) {
    if(modules[a]._dependencies.hasOwnProperty(b)){
      return -1;
    }
    return 1;
  })

  _.each(sortedModules, function(ns){
    var exported = self.exports(modules[ns]._factory, ns);
    if(false === exported){
      compiled += ";(" + modules[ns]._factory + ').call( global.' + ns + ' );\n';
    } else {
      compiled += exported;
    }
  });

  compiled = "(function(global){\n" + compiled + "\n})(this);"

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
 * Define a module that exports dierctly.
 */
var _checkExports = /\bthis\.exports\b/g
Build.prototype.exports = function ( factory, namespace ) {
  if(!_checkExports.test(factory)){
    return false;
  }
  var render = 'var exporter = {};\n(' + factory + ').call(exporter);\n';
  render += 'global.' + namespace + ' = exporter.exports;\n'
  return render;
}

Build.prototype.renderNamespace = function ( namespace ) {
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

Build.prototype.loader = function ( namespace, next, error ) {

  var src = this._z.getMappedPath(namespace);

  if(!src){
    src = namespace.replace(/\./g, '/') + '.js';
  }
  
  src = process.cwd() + '/' + this._z.env.root + src;

  var file = fs.readFileSync(src, 'utf-8');

  var zModule = Function('z, module', file);
  zModule(this._z, this._z);

  this._z.env.modules[namespace].done(next, error);
}

Build.prototype.start = function ( src ) {

  var file = fs.readFileSync(src, 'utf-8')
    , self = this;

  var zModule = Function('z, module', file);
  zModule(this._z, this._z);

  this._z.env.modules[this.options.mainNamespace].done( function renderModule () {
    self.render();
    self._onDone();
  });

}

Build.prototype.done = function ( next ) {
  var self = this;
  this._onDone = function(){
    next.apply(self, arguments);
  }
}

module.exports = Build;