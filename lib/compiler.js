/**
 * z.Build compiler.
 */

var u = require('./util.js');

/**
 * ----------------------------------------------------------------------
 * Compiler
 *
 * Helper functions to compile modules. When registering loaders, you can
 * use the compiler via the 'build' method:
 *  
 *    z.loader('myLoader')
 *      .build(function(req, res, compiler){ ... });
 */
var Compiler = function(){
  this._compiled = "";
}

/**
 * Escape a string
 */
Compiler.prototype.escape = function (txt){
  var escapes = {
        "'" : "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\t': 't',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
      }
    , escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  return txt.replace(escaper, function(match) { return '\\' + escapes[match]; });
}

Compiler.prototype.compile = function (/* strings */){
  var self = this;

  u.each(arguments, function(str){
    self._compiled += str;
  });
}

Compiler.prototype.render = function(){
  return this._compiled;
}

module.exports = Compiler;