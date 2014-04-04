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

var Build = function ( options ) {

  var self = this;

  this.options = _.defaults(this.options, options);

  // Mock a global env for z.
  this._global = {};
  this._global.MODULE_LOADER = this.loader;

  // Bind a copy of z to the mocked up env.
  zFactory(this._global);
  this._z = this._global.z;
  this._z.env.environment = 'node';

  this._exists = {};

  // Start the app.
  this.start(this.options.main);
}

Build.prototype.render = function () {
  var modules = z.env.modules
    , namespaces = z.env.namespaces
    , compiled = ''
    , self = this;

  compiled += "/* namespaces */\n";
  _.each(namespaces, function(ns){
    compiled += self.renderNamespace(ns);
  });

  compiled += "\n/* modules */\n";
  _.each(modules, function(module, ns){
    compiled += "/* module:" + ns + " */\n"
    compiled += "(function () {\n" + module._factory + '\n}).call( ' + ns  + '};\n';
  });

  if(this.options.optimize){
    compiled = UglifyJS.minify(compiled, {fromString: true}).code;
  }

  if(this.options.dest){
    fs.writeFileSync(this.options.dest, compiled);
  }

  return compiled;
}

Build.prototype.renderNamespace = function ( namespace ) {
  var cur = ''
    , render = ''
    , exists = this._exists
    , parts = namespace.split('.');
  for (var part; parts.length && (part = parts.shift()); ) {
    cur += cur + '.' + part;
    if (exists[part]) {
      exists = exists[part];
    } else {
      exists = exists[part] = {};
      render += cur + '= {};\n';
    }
  }

  return render;
}

Build.prototype.loader = function ( namespace, next, error ) {

  var src = this._z.getMappedPath(namespace);

  if(!src){
    src = namespace.replace(/\./g, '/') + '.js';
  }
  
  src = this._z.env.root + src;

  var file = fs.readFileSync(src, 'uft-8');

  var zModule = Function('z, module', file);
  zModule(this._z, this._z);

}

Build.prototype.start = function ( src ) {

  var file = fs.readFileSync(src, 'uft-8');

  var zModule = Function('z, module', file);
  zModule(this._z, this._z);

  self._z.env.modules[this.options.mainNamespace].done( function renderModule () {
    self.render();
  });

}