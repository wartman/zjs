/**
 * zjs @VERSION
 *
 * Copyright 2014
 * Released under the MIT license
 *
 * Date: @DATE
 */

(function(global, factory){

  // For CommonJS environments.
  if ( typeof module === "object" && typeof module.exports === "object" ) {
    global = module.exports;
  }
  
  factory( global );

}( typeof window !== "undefined" ? window : this, function( root ) {