/*!
 * zjs 2.0.0
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: 2014-07-16T21:37Z
 */

(function (factory) {
  if ( typeof module === "object" && typeof module.exports === "object" ) {
    // For CommonJS environments.
    factory(module.exports);
    global.z = module.exports.z;
  } else {
    factory(window);
  }
}( function (root, undefined) {
// zjs
// ===
// zjs' api is intentionally minimal, with the intent to impact
// your code as little as possible.
//
// Modules are defined and imported with module paths, which are
// dot-seperated strings like 'foo.bar' or 'app.bar.bin'. zjs
// interprets paths similarly to Java, where the last segment
// of the path is evaluated to be a JavaScript file, and the preceding
// segments the directory structure. Thus, 'app.foo.bar' will load the
// file 'app/foo/bar.js' (unless the path is mapped elsewhere: see `z.map`
// and `z.config`).
//
// Inside a script, modules are available as javascript objects that match
// a module path. There aren't any special export methods or convoluted
// namespace wrapppers to deal with, just plain javascript objects you can
// define as you'd like.
//
// Here's an example of a simple zjs module:
//
//    z.module('foo.bar');
//
//    z.imports(
//      'foo.bin',
//      'foo.bax'
//    );
//
//    foo.bar.Bin = 'bar';
//    foo.bar.Bax = foo.bin.SomeProperty + 'bax';
//
// Contrived, but you get the idea.

var z = root.z = {};

z.VERSION = "2.0.0";

// Z's config (private: use z.config to get values)
var _config = {
  debug: false,
  root: '',
  maps: {
    modules: {},
    namespaces: {}
  }
};

// Set or get a configuation option. To set several options
// at once, pass an object to `key`. To get an option without
// changing its value, simply omit the `value` arg.
z.config = function (key, value) {
  if ('object' === typeof key) {
    for (var item in key) {
      z.config(item, key[item]);
    }
    return;
  }
  if (typeof value !== 'undefined') {
    if ('map' === key) return z.map(value);
    if ('namespaces' === key) return z.mapNamespace(value);
    _config[key] = value;
  }
  return ('undefined' !== typeof _config[key]) 
    ? _config[key] : false;
};

// Map a module to the given path.
//
//    z.map('Foo', 'libs/foo.min.js');
//    z.imports('Foo'); // -> Imports from libs/foo.min.js
//
// Note that this method will automatically work with any 
// script that exports a global var, so long as `mod` is 
// equal to the global you want. Here is an example for jQuery:
//
//    z.map('$', 'libs/jQuery.min.js')
//
z.map = function (mod, path) {
  if ('object' === typeof mod) {
    for (var key in mod) {
      z.map(key, mod[key]);
    }
    return;
  }
  _config.maps.modules[mod] = path;
};

// Map a namespace to the given path.

//    z.mapNamespace('Foo.Bin', 'libs/FooBin');
//    // The following import will now import 'lib/FooBin/Bax.js'
//    // rather then 'Foo/Bin/Bax.js'
//    z.imports('Foo.Bin.Bax');

z.mapNamespace = function (ns, path) {
  if ('object' === typeof ns) {
    for (var key in ns) {
      z.mapNamespace(key, ns[key]);
    }
    return;
  }
  _config.maps.namespaces[ns] = path;
};

// Creates a new module. This method creates an object based on
// the passed module path, ensuring that all segments are defined.
// It should be at the top of every zjs module.
// 
//    z.module('app.foo.bar');
//    // The module is now available as a basic javascript object.
//    app.foo.bar.Bin = function () { /* code */ };
//
z.module = function (name) {
  var cur = root;
  var parts = name.split('.');
  for (var part; parts.length && (part = parts.shift()); ) {
    if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
  return cur;
};

// Import a module or modules. Imported modules are then available for the
// current module.
//
// You can import all dependencies at once by overloading this method, or
// load them one at a time. For example:
//
//    z.imports(
//      'app.foo',
//      'app.bar'
//    );
//
// If only one argument is passed, `z.imports` will return that module. This
// can be handy if you want to alias a module for whatever reason:
//  
//    var foo = z.imports('app.long.unweildly.module.path.foo');
//
z.imports = function (/*...*/) {
  if (arguments.length === 1) {
    var name = arguments[0];
    var cur = root;
    var parts = name.split('.');
    for (var part; part = parts.shift(); ) {
      if(typeof cur[part] !== "undefined"){
        cur = cur[part];
      } else {
        return null;
      }
    }
    return cur;  
  }
};
}));