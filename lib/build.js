/**
 * z.build 0.0.2
 */

var Compiler = require('./compiler');
var Z = require('../dist/z');
var UglifyJS = require("uglify-js");
var u = require('./util.js');
var fs = require('fs');

var z = Z.z;
var define = Z.define;

z.noConflict();

/**
 * ----------------------------------------------------------------------
 * Overwrite z.module's plugins for use in the node env.
 */

/**
 * The actual contents of loaded module files are stored here.
 */
var _contents = {};

/**
 * Register the callback to run when modules are loaded.
 */
z.loader.build = function(req, res, loader){
  var compiler = new Compiler();
  loader._build(req, res, compiler);
  _contents[req.from] = compiler.render();
}

/**
 * Mock script loading.
 */
var ScriptMock = z.Resolver.extend({
  __init__: function(req){
    this.load(req);
  },
  load: function(req){
    var contents = fs.readFileSync(req.src, 'utf-8')
      // Wrap the contents in a function that we can pass stuff to.
      // This is done to get around the fact that node doesn't have any globals,
      // so z will be undefined if we try to load it normally.
      , zModule;

    try{
      zModule = Function('z, module, define', contents);
      zModule(z, z, define);
    } catch(e) {
      console.log('  ...building failed, wrapping file');
      // Stick it in a wrapper and hope for the best!
      zModule = Function('z, module, define', 'z(function(){'+ contents +'});');
      zModule(z, z, define);
    }

    this.resolve(contents);
  }
}); 

/**
 * Replace the script loader to use the mock.
 */
z.loader('script')
  .method(ScriptMock)
  .handler(function(req, res, next, error){
    var name = req.from;
    console.log('  ...added: ', name);
    
    z.ensureModule(name);
    next();
  })
  .build(function(req, res, compiler){
    var annon = /z\(\)|\bmodule\b\(\)/
      , annonCallback = /[z|\bmodule\b]?\(\s?function/;

    if(annon.test(res)){
      res = res.replace(annon, "z('" + req.from + "')"); 
    } else if (annonCallback.test(res)){
      res = res.replace(annonCallback, "z('" + req.from + "', function");
    }

    compiler.compile(res);
  });

// Replace ajax
z.Ajax = z.Resolver.extend({
  __init__: function(req){
    this.load(req);
  },
  load: function(req){
    var name = req.from
      , contents = fs.readFileSync(req.src, 'utf-8');

    this._value = contents;

    this.resolve(contents);
  }
});

/**
 * Replace the ajax loader to use the mock.
 */
z.loader('ajax')
  .method(z.Ajax)
  .handler(function(req, res, next, error){
    var name = req.from;

    console.log('  ...added file: ', name);

    if(res){
      var factory = "z('"+name+"').exports(function(){ return '" + escape(res) + "'; });";
      var zModule = Function('z, module, define', factory);

      // Run the module.
      zModule(z, z, define);
    } else {
      console.log('  Warning: result was empty. Continuing, but be sure this is desired...')
    }

    next();
  })
  .build(function(req, res, compiler){
    compiler.compile(
      "z('"+req.from+"').exports(function(){ return '", 
      compiler.escape(res),
      "'; });"
    );
  });

/**
 * ----------------------------------------------------------------------
 * z.Build
 *
 * Fit's module-compiler, used to crunch things into a single file.
 * 
 * Fit projects ideally should be built before they are made live --
 * the module system should be used mainly as a development tool.
 */
var Build = function(options){

  var defaults = {
    optimize: false,
    main: 'main',
    buildfile: false,
    shim: {
      'jquery' : function(mod){
        var compile = mod._factory.toString();
        return '/*jquery*/\njquery: (' + compile + ')(),\n\n'
      }
    }
  };

  this.options = u.defaults(defaults, options);
}

/**
 * Setup Build.
 *
 * @param {Object} options
 */
Build.prototype.setup = function(options){
  this.options = u.defaults(this.options, options);
}

/**
 * Start loading files.
 *
 * @param {String} main Path to the main file.
 * @param {String} dest Path to the destination dir
 * @param {Function} next
 */
Build.prototype.start = function(main, dest, next){
  var self = this
    , mainName = main.replace('.js', '').replace(/\//g, '.');

  if(this.options.buildfile){
    try{
      var options = require(main)
        , paths = u.extract(['main', 'dest'], options);
      main = paths.src;
      dest = paths.dest;
      this.setup(options);
    } catch(e){
      console.log('Could not find a buildz.js file.\nTry providing a main file (e.g. \'main.js\') or make sure you are in the correct dir.')
      return false;
    }
  }

  z.setup({
    env: 'server'
  });

  console.log('\nbuilding...\n');

  var loader = new ScriptMock({src: main});

  loader.done(function(){
    if(self.options.main){
      mainName = self.options.main;
    }

    z.ensureModule(mainName);
    _contents[mainName] = fs.readFileSync(main, 'utf-8');

    console.log('  ...main module found');
    console.log('  ...added: ', mainName);

    if(self.options.project === undefined){
      self.options.project = main.replace('.js', '').replace(/\//g, '.');
    }

    z(mainName).done(function(){
      var rendered = self.render(dest);
      if(u.isFunction(next)){
        next(rendered);
      }
    });
  }, function(e){
    console.error(e);
  });
}

/**
 * Compile a module.
 *
 * @param {String} name The module name
 * @return {String}
 */
Build.prototype.compile = function(name){

  if(false === z.has(name)){
    console.log('   The module '+ name + 'was loaded, but is not in the registry.')
    console.log('   continuing...');
    console.log();
    return;
  }

  var content = _contents[name];

  if(typeof content === "undefined"){
    return '';
  }

  return '/*' + name + '*/\n' + content + '\n\n';
}

/**
 * Compile and return a copy of `z`.
 * @todo: Make configurable.
 *
 * @return {String}
 */
Build.prototype.renderZ = function(){
  // Eventually make this configurable.
  var root = __dirname + '/../'
    , rendered = '';

  u.each([
    "src/util.js",
    "src/core.js",
    "src/Class.js",
    "src/Resolver.js",
    "src/Script.js",
    "src/Ajax.js",
    "src/Loader.js",
    "src/Module.js",
    "src/amd.js",
  ], function(file){
    rendered += fs.readFileSync(root + file, 'utf-8') + "\n\n";
  });

  rendered = '\n/*! zjs */\n' + UglifyJS.minify(rendered, {fromString: true}).code;

  return rendered;
}

/**
 * Render the app.
 *
 * @param {String} dest
 * @return {String}
 */
Build.prototype.render = function(dest){

  var self = this
    , rendered = '';

  // Check to see if the user defined any build settings in
  // z.setup. This could include compile shims, destinations, etc.
  if(z.config.build){
    u.extend(this.options, z.config.build);
    delete z.config.build;
  }

  dest = (dest || this.options.dest);

  if(!dest){
    console.log('No destination!');
    console.log('Set [dest] in one of the following ways:');
    console.log('   console: $ zjs build [src] [dest]');
    console.log('   in main.js: z.setup({ ... build:{ ... dest:[dest]... } ... });');
    console.log('   in zbuild.js: ... dest:[dest] ...');
    console.log('No files have been modified.');
    return;
  }

  u.each(z.modules, function(mod, name){
    rendered += self.compile(name);
  });

  rendered = '/* modules */\n\n' + rendered + '\n';

  // Add z itself to the top of the compiled project
  rendered = '(function(root){\n' + this.renderZ() + rendered + '\n})(window);';

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

  console.log('\nbuilt to '+ dest + '\n');

  if(typeof next == 'function'){
    next(dest, rendered);
  }

  return rendered;
}

// Export instance of build.
exports = module.exports = new Build;

// Export Build
exports.Build = Build
