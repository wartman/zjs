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
  this._global.MODULE_LOADER = this.loader.bind(this);

  // Bind a copy of z to the mocked up env.
  zFactory(this._global);
  this._z = this._global.z;
  this._z.env.environment = 'node';

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
    , compiled = ''
    , self = this;


  compiled += "/* namespaces */\n";
  _.each(modules, function(val, ns){
    compiled += self.renderNamespace(ns);
  });

  compiled += "\n/* modules */\n";
  _.each(modules, function(module, ns){
    compiled += ";(" + module._factory + ').call( global.' + ns + ' );\n';
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

Build.prototype.renderNamespace = function ( namespace ) {
  var cur = 'global'
    , render = ''
    , exists = this._exists
    , parts = namespace.split('.');
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