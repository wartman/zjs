/**
 * zjs @VERSION
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: @DATE
 */

(function (global, factory) {

  if ( typeof module === "object" && typeof module.exports === "object" ) {
    // For CommonJS environments.
    module.exports = factory;
  } else {
    factory(global);
  }

}( typeof window !== "undefined" ? window : this, function (global, undefined) {