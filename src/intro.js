/*!


    __________
   /\_______  \
   \/______/  /
          /  /
         /  /
        /  /______    __
       /\_________\  /\_\
       \/_________/  \/_/



  zjs @VERSION

  Copyright 2014
  Released under the MIT license

  Date: @DATE
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