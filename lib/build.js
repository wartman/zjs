/**
 * z.build 0.0.2
 */

var Compiler = require('./compiler');
var Z = require('../dist/z');
var UglifyJS = require("uglify-js");
var u = require('./util.js');
var fs = require('fs');
var progress = require('./progress');

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
 *
 * @param {Object} req 
 * @param {String} res
 * @param {z.Loader} loader The loader calling this function. This
 *   is so each plugin can hook in with its own particular callback.
 *   Like most of the rest of the build stuff, a hell of a mess
 *   at the moment. Look into some kind of di pattern for all this?
 */
z.loader.build = function(req, res, loader){

  var compiler = new Compiler();

  if(z.config.build && z.config.build.hasOwnProperty('shim')
     && z.config.build.shim.hasOwnProperty(req.from) 
     && u.isFunction(z.config.build.shim[req.from]) ){
    _contents[req.from] = z.config.build.shim[req.from](req,res,compiler);
    progress.ok('added: ', req.from, '(shimed)');
    return;
  }

  loader._build(req, res, compiler);
  progress.ok('added: ', req.from);
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
      progress.error('Building failed, wrapping file: ', req.from);
      // Stick it in a wrapper and hope for the best!
      zModule = Function('z, module, define', 'z(function(){\n'+ contents +'\n});');
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
    
    z.ensureModule(name);
    next();
  })
  .build(function(req, res, compiler){
    compiler.compile( compiler.normalize(req, res) );
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

    if(res){
      var factory = "z('"+name+"').exports(function(){ return '" + escape(res) + "'; });";
      var zModule = Function('z, module, define', factory);

      // Run the module.
      zModule(z, z, define);
    } else {
      progress.error('Warning: result was empty. Continuing, but be sure this is desired.')
    }

    next();
  })
  .build(function(req, res, compiler){
    compiler.compile(
      "z('"+req.from+"').exports(function(){\n return '", 
      compiler.escape(res),
      "';\n });"
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
 * Static functions.
 */

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

  progress.title('Building');

  if(this.options.buildfile){
    var buildz = JSON.parse(fs.readFileSync(main), 'utf-8');

    progress.done('buildz.json found');

    main = buildz.main + '.js';
    dest = buildz.dest;

    this.setup(buildz.buildSetup);
    z.setup(buildz.zSetup);
  }

  z.config.env = 'server';

  var loader = new ScriptMock({src: main});

  loader.done(function(){
    if(self.options.main){
      mainName = self.options.main;
    }

    z.ensureModule(mainName);
    _contents[mainName] = fs.readFileSync(main, 'utf-8');

    progress.done('main module found');
    progress.ok('added: ', mainName);

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
    progress.error(e);
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
    progress.error('The module '+ name + 'was loaded, but is not in the registry.')
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
    , make = JSON.parse( fs.readFileSync(root + 'make.json', 'utf-8') )
    , rendered = '';

  u.each(make.noHttp, function(file){
    rendered += fs.readFileSync(root + file, 'utf-8') + "\n\n";
  });

  rendered = '\n/*! zjs */\n' + rendered;

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
    progress.error('No destination! No files have been modified\n');
    return;
  }

  u.each(z.modules, function(mod, name){
    rendered += self.compile(name);
  });

  rendered = '/* modules */\n\n' + rendered + '\n';

  if(this.options.compileZjs !== false){
    progress.ok('added:  zjs')
    rendered = this.renderZ() + rendered;
  }

  // Add z itself to the top of the compiled project
  rendered = '(function(root){' + rendered + '})(window);';

  if(this.options.optimize){
    progress.ok('uglifying...');
    rendered = UglifyJS.minify(rendered, {fromString: true}).code;
    progress.done('...uglified');
  }

  if(this.options.about){
    this.options.project += '\n' + this.options.about;
  }

  rendered = '/*'+this.options.project+'*/\n' + rendered;

  if(dest){
    fs.writeFileSync(dest, rendered);
    progress.done('built to '+ dest + '\n');

    if(this.options.optimizeToMin && !this.options.optimize){
      progress.ok('uglifying to .min file...');
      var minfied = UglifyJS.minify(rendered, {fromString: true}).code;
      var mindest = dest.replace('.js', '.min.js');
      fs.writeFileSync(mindest, minfied);
      progress.done('...uglified');
      progress.done('minified to '+ mindest + '\n');
    }
  }

  if(typeof next == 'function'){
    next(dest, rendered);
  }

  return rendered;
}

// Export instance of build.
exports = module.exports = new Build;

// Export Build
exports.Build = Build
