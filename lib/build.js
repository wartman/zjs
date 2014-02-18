/**
 * z.build 0.0.2
 */

var z = require('../dist/z').z;
var imports = require('../dist/z').imports;
var fitExports = require('../dist/z').exports;
var define = require('../dist/z').define;
var UglifyJS = require("uglify-js");
var fs = require('fs');

/**
 * Overwrite z.module's plugins for use in the node env.
 */
z.module.plugin('script', function(req, res, rej){

  var name = req.from

  console.log('  ...fitting: ', name);

  // Load the module.
  loadFitModule(req.url);

  z.App._ensureModule(name);

  res();

});

z.module.plugin('file', function(req, res, rej){

  var name = req.from
    , contents = fs.readFileSync(req.url, 'utf-8');

  console.log('  ...fitted file: ', name);

  var factory = "z.module('"+name+"').exports(function(){ return '" + escape(contents) + "'; });";
  var fitModule = Function('z, imports, exports, define', factory);

  // Run the module.
  fitModule(z, imports, exports, define);

  res();

});

/**
 * Load a z module for use in node.
 *
 * @param {String} path
 * @return {Function} A factory that will create the module.
 */
var loadFitModule = function(path){

  var contents = fs.readFileSync(path, 'utf-8')
    // Wrap the contents in a function that we can pass stuff to.
    // This is done to get around the fact that node doesn't have any globals,
    // so z will be undefined if we try to load it normally.
    , fitModule;

  try{
    fitModule = Function('z, imports, exports, define', contents);
    fitModule(z, imports, fitExports, define);
  } catch(e) {
    console.log('  ...fitting failed, wrapping file');
    // Stick it in a wrapper and hope for the best!
    fitModule = Function('z, imports, exports, define', 'exports(function(){'+ contents +'});');
    fitModule(z, imports, fitExports, define);
  }

  return fitModule;

}

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
var escape = function(txt){
  return txt.replace(escaper, function(match) { return '\\' + escapes[match]; });
}

/**
 * ----------------------------------------------------------------------
 * z.Build
 *
 * Fit's module-compiler, used to crunch things into a single file.
 * 
 * Fit projects ideally should be z together before they are made live --
 * the module system should be used mainly as a development tool.
 */
var Build = function(options){

  var defaults = {
    optimize: false,
    main: 'main',
    buildfile: false,
    shim: {
      'jquery' : function(mod){
        var compile = mod.factory.toString();
        return '/*jquery*/\n(' + compile + ')();\n\n'
      }
    }
  };

  this.options = z.util.defaults(defaults, options);
}

Build.prototype.setup = function(options){
  this.options = z.util.defaults(this.options, options);
}

Build.prototype.start = function(main, dest, next){
  var self = this
    , mainName = main.replace('.js', '').replace(/\//g, '.');
    ;

  if(this.options.buildfile){
    try{
      var options = require(main)
        , paths = z.util.extract(['main', 'dest'], options);
      main = paths.src;
      dest = paths.dest;
      this.setup(options);
    } catch(e){
      console.log('Could not find a together.js file.\nTry providing a starting file (e.g. \'main.js\') or make sure you are in the correct dir.')
      return false;
    }
  }

  z.setup({
    env: 'server'
  });

  console.log('\nfitting together...\n');

  loadFitModule(main);

  if(this.options.main){
    mainName = this.options.main;
  }

  z.App._ensureModule(mainName);

  console.log('  ...main module found');
  console.log('  ...fitted: ', mainName);

  if(this.options.project === undefined){
    this.options.project = main.replace('.js', '').replace(/\//g, '.');
  }

  z.module.start()
  .then(function(){
    return self.render(dest);
  })
  .then(function(rendered){
    if(z.util.isFunction(next)){
      next(rendered);
    }
  });
}

Build.prototype.compile = function(name){

  if(false === z.module.has(name)){
    console.log('   The module '+ name + 'was loaded, but is not in the registry.')
    console.log('   continuing...');
    console.log();
    return;
  }

  var mod = z.App._modules[name]
    , rendered = ''
    , deps = mod.deps
    , factory = mod.factory.toString()
    , compiled = mod.compiled
    ;

  if(this.options.shim.hasOwnProperty(name)){
    rendered = this.options.shim[name](mod);
    return rendered;
  }

  // Build the compiled string.
  rendered = '/*'+name+'*/\n'
  rendered += "z.module('"+name+"').\n";

  // if(false !== compiled){
  //   // Skip all other steps and just use this.
  //   rendered += 'exports(' + compiled.toString() + ');\n\n';
  //   return rendered;
  // }

  // Build imports.
  if(deps.data.length > 0){
    var imp = [];
    deps.each(function(dep){
      imp.push(JSON.stringify(dep)); // Seems the most flexable method.
    });
    rendered += "imports(\n" + imp.join(',\n') +'\n).';
  }

  rendered += 'exports(' + factory + ');\n\n';

  return rendered;
}

Build.prototype.renderFit = function(){
  // Eventually make this configurable.
  var root = __dirname + '/../src/'
    , rendered = ''
    ;

  rendered += fs.readFileSync(root + 'polyfill.js', 'utf-8') + "\n\n";
  rendered += fs.readFileSync(root + 'core.js', 'utf-8') + "\n\n";
  rendered += fs.readFileSync(root + 'util.js', 'utf-8') + "\n\n";
  rendered += fs.readFileSync(root + 'class.js', 'utf-8') + "\n\n";
  rendered += fs.readFileSync(root + 'iterator.js', 'utf-8') + "\n\n";
  rendered += fs.readFileSync(root + 'promise.js', 'utf-8') + "\n\n";
  rendered += fs.readFileSync(root + 'events.js', 'utf-8') + "\n\n";
  rendered += fs.readFileSync(root + 'module.js', 'utf-8') + "\n\n";
  rendered += fs.readFileSync(root + 'ajax.js', 'utf-8') + "\n\n";
  rendered += fs.readFileSync(root + 'scripts.js', 'utf-8');
  rendered += '\n\n';

  return rendered;

}

Build.prototype.render = function(dest){

  var self = this
    , rendered = '';

  // Check to see if the user defined any together settings in
  // z.setup. This could include compile shims, destinations, etc.
  if(z.config.together){
    z.util.extend(this.options, z.config.together);
    delete z.config.together;
  }

  dest = (dest || this.options.dest);

  z.util.each(z.App._modules, function(mod, name){
    rendered += self.compile(name);
  });

  delete z.config.env;

  // Add the config
  rendered = 'z.setup(' + JSON.stringify(z.config) + ');\n\n' + rendered;

  // Add the module-start call.
  // (used in place of the onready call)
  // (make configurable?)
  rendered += 'z.module.start();';

  // Add z itself to the top of the compiled project
  rendered = '(function(root){' + this.renderFit() + rendered + '\n})(window);';

  if(this.options.optimize){
    console.log('\nuglifying...');
    rendered = UglifyJS.minify(rendered, {fromString: true}).code;
    console.log('\n  ...uglified');
  }

  if(this.options.about){
    this.options.project += '\n' + this.options.about;
  }

  rendered = '/*'+this.options.project+'*/\n' + rendered;

  fs.writeFileSync(dest, rendered);

  console.log('\nCompiled to '+ dest + '\n');

  if(typeof next == 'function'){
    next(dest, rendered);
  }

  return rendered;
}

// Export instance of together.
exports = module.exports = new Build;

// Export Build
exports.Build = Build
