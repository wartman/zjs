// The bare minimum implementation of z, used when compiling projects.

var z = root.z = function (name, factory) {
  _createObjectByName(name, {});
  factory();
};

z.configuration = {};

// Define an import
z.imports = function (/*...*/) {
  if (arguments.length === 1) {
    return _getObjectByName(arguments[0]);
  }
};

// Set config items.
z.config = function (key, value) {
  if ('object' === typeof key) {
    for (var item in key) {
      z.config(item, key[item]);
    }
    return;
  }
  if (value) z.configuration[key] = value;
  return ('undefined' !== typeof z.configuration[key]) 
    ? z.configuration[key] : false;
};

// 'Map' isn't actually useful in a compiled project,
// but we need a function to keep errors from being
// thrown.
z.map = function () {
  // no-op
};

// System helpers.
z.sys = {
  getObjectByName: _getObjectByName,
  createObjectByName: _createObjectByName
};

// Create a new object from a provided string, ensuring each
// level is defined.
function _createObjectByName (name, exports, env) {
  var cur = env || root;
  var parts = name.split('.');
  for (var part; parts.length && (part = parts.shift()); ) {
    if(!parts.length && exports !== undefined){
      // Last part, so export to this.
      cur[part] = exports;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
  return cur;
};

// Get an object that matches the provided string, or return `null`
// if the object is undefined.
function _getObjectByName (name, env) {
  var cur = env || root;
  var parts = name.split('.');
  for (var part; part = parts.shift(); ) {
    if(typeof cur[part] !== "undefined"){
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;  
};