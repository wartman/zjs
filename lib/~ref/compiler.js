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
var Compiler = function(req, res, raw){
  this._compiled = "";
}

/**
 * Escape a string
 */
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
Compiler.prototype.escape = function (txt){
  return txt.replace(escaper, function(match) { return '\\' + escapes[match]; });
}

Compiler.prototype.compile = function (/* strings */){
  var self = this;

  u.each(arguments, function(str){
    self._compiled += str;
  });
}

// THIS COULD EASILY BE BETTER
// Works for the moment tho?
var annon = /z\(|\bmodule\b\(/
  , annonAMD = /\bdefine\b\(/
  , annonCallback = /z\(\s?\bfunction\b|\bmodule\b\(\s?\bfunction\b/
  , annonAMDCallback = /\bdefine\b\(\s?\bfunction\b/
Compiler.prototype.normalize = function(req, res){
  if (annonAMDCallback.test(res)){
    res = res.replace(annonAMD, "define('" + req.from + "',");
  } else if(annonAMD.test(res)){
    res = res.replace(annonAMD, "define('" + req.from + "'"); 
  } else if (annonCallback.test(res)){
    res = res.replace(annon, "z('" + req.from + "',");
  } else if(annon.test(res)){
    res = res.replace(annon, "z('" + req.from + "'"); 
  } 
  return res;
}

Compiler.prototype.render = function(){
  return this._compiled;
}

module.exports = Compiler;