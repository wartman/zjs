  /**
   * ----------------------------------------------------------------------
   * z.module
   *
   * z's module loading system.
   * Compatable with AMD.
   */

  /**
   * Constants
   */
  var MODULE_GLOBAL_STATUS = {
    PENDING: 0,
    DONE: 1,
    REJECTED: -1
  };

  /**
   * The module manager.
   */
  z.Application = z.Class({

    config: {
      shim: {},
      alias: {}
    },

    __init__: function(config){

      this.config = z.util.defaults(this.config, config);

      this._modules = {};
      this._plugins = {};

      // The app is 'done' until modules are added to it.
      this._state = MODULE_GLOBAL_STATUS.DONE;
      this._tmp = null;

      // Make this the active app.
      this.bindApi();
    },

    setup: function(config){
      this.config = z.util.defaults(this.config, config);
    },

    /**
     * Checks all modules and loads any that need it.
     * This is run internally: Other then some testing instances,
     * you shoulding need to use it.
     *
     * @return {z.Promise}
     */
    start: function(next){

      var self = this
        , pending = false;

      var promise = new z.Promise(function(res, rej){

        if(self.isRejected()){
          rej('Cannot continue from rejected state');
        }

        z.u(self._modules).each(function(mod){
          if( mod instanceof Module && mod.isPending() ){
            res(mod.enable()); // bind promise to enable.
            pending = true;
            return true; // break loop
          }
        });

        if(pending) return;

        res();

      });

      if(z.util.isFunction(next)){
        promise.then(next);
      }

      // Default callback.
      // Calling done will throw caught errors
      promise.done(function(val){
        if(pending) self.start();
      });

      return promise;      
    },

    /**
     * Create a new module.
     *
     * @param {String} name (optional)
     * @return {Module}
     */
    add: function(name){
      
      this._state = MODULE_GLOBAL_STATUS.PENDING;

      if(typeof name === "undefined"){
        var node;
        if(z.Scripts.useInteractive){
          // For < IE9 (and 10, apparently -- seems to get called there too)
          // I think this is because <IE9 runs onload callbacks BEFORE the code
          // executes, while other browsers do it right after.
          node = z.Scripts.currentlyAddingScript || z.Scripts.getInteractiveScript();
          name = node.getAttribute('data-from');
        } else {
          // Assign to a temp cache, to be named by the onload callback.
          this._tmp = new Module();
          return this._tmp;
        }
      }

      if(this.has(name)){
        name = z.util.uniqueId(name);
      }

      this._modules[name] = new Module();
      return this._modules[name];

    },

    /**
     * Check if the module exists.
     *
     * @param {String} name
     */
    has: function(name){
      return this._modules.hasOwnProperty(name);
    },

    /**
     * Get a module's content from the registry.
     * Require methods/classes from the module by passing an array
     * as the second arg.
     *
     * @param {String} from
     * @param {String} uses
     * @throws {Error} If the module does not exist in the registry this will
     *   throw an error. Check z.module.has(moduleName) before calling this
     *   method.
     * @return {Object || false} Returns false if the module is not enabled.
     */
    get: function(from, uses){
      var mod
        , context = {};

      if(false === this.has(from)){
        throw new Error('Module '+from+' does not exist in the registry.');
        return false;
      }

      if('*' === uses){
        uses = false;
      }

      if(uses && false === uses instanceof Array){
        uses = [uses];
      }

      mod = this._modules[from];

      if(!mod.isEnabled()){
        return false;
      }

      if(uses instanceof Array
        && uses.indexOf('*') < 0){
        z.util.each(uses, function(item){
          if(mod.definition.hasOwnProperty(item)){
            context[item] = mod.definition[item];
          }
        });
        return context;
      }

      context[from.split('.').pop()] = mod.definition;
      return context;
    },

    /**
     * Parse a dot-seperated name into a URL.
     *
     * @param {Object} req
     */
    findUrl: function(req){
      var shim = this.config.shim
        , alias = this.config.alias
        , name = req.from
        , ext = req.type
        , nameParts = name.split('.')
        , changed = false
        , src = ''
        ;

      ext = (ext || 'js');

      z.util.each(nameParts, function(part, index){
        if(alias.hasOwnProperty(part)){
          nameParts[index] = alias[part];
        }
      });

      name = nameParts.join('.');
      if(shim.hasOwnProperty(name)){
        src = shim[name].src;
      } else {
        src = name.replace(/\./g, '/');
        src = z.config.module.root + src + '.' + ext;
      }

      return src;
    },

    /**
     * Bind global imports, exports and define to this instance
     * of z.Application
     */
    bindApi: function(){
      var self = this;
      root.define = function(){
        return self._amdDefine.apply(self, arguments);
      }
      // Confirm that this is AMD complient, per specs
      // see: https://github.com/amdjs/amdjs-api/wiki/AMD
      root.define.amd = {
        jQuery: true 
      };
      root.imports = function(){
        return self._apiImports.apply(self, arguments);
      }
      root.exports = function(cb){
        return self._apiExports(cb);
      }
    },

    isPending: function(){
      return this._state === MODULE_GLOBAL_STATUS.PENDING;
    },

    isDone: function(){
      return this._state !== MODULE_GLOBAL_STATUS.PENDING;
    },

    isRejected: function() {
      return this._state === MODULE_GLOBAL_STATUS.REJECTED;
    },

    /**
     * Plugins for z's loader.
     * Plugins are wrapped in a promise, which passes its resolver
     * and rejector functions as arguments (by convention, 'res' and 'rej').
     *
     * @param {String} name
     * @param {Function} cb
     */
    plugin: function(name, cb){
      this._plugins[name] = function(mod, req, next, err){

        var promise = new z.Promise(function(res, rej){
          cb.call(mod, req, res, rej);
        });
        
        if(z.util.isFunction(next)){
          promise.then(next);
        }

        if(z.util.isFunction(err)){
          promise.catches(err);
        }

        return promise;
      }
    },

    _usePlugin: function(name){
      if(this._plugins.hasOwnProperty(name)){
        return this._plugins[name];
      }

      this._state = MODULE_GLOBAL_STATUS.REJECTED;
      throw new Error('Plugin was not found: '+name);
      return false;
    },

    /**
     * Ensure that a module is nammed.
     *
     * @param {String} name
     */
    _ensureModule: function(name){
      var tmp = this._tmp;
      if(null === tmp){
        return;
      }
      this._tmp = null;
      if(!tmp instanceof Module){
        return;
      }
      this._modules[name] = tmp;
      return;
    },

    /**
     * Investigate the state of the app and set the current state.
     */
    _checkState: function(){
      var self = this
        , done = true;
      if(this.isRejected()){
        // Can't transition out of a rejected state.
        return;
      }
      z.util.each(this._modules, function(mod){
        if(!mod.isDone()){
          self._state = MODULE_GLOBAL_STATUS.PENDING;
          done = false;
          return true;
        }
        if(mod.isRejected()){
          self._state = MODULE_GLOBAL_STATUS.REJECTED;
          done = false;
          return true;
        }
      });
      if(done){
        this._state = MODULE_GLOBAL_STATUS.DONE;
      }
    },

    /**
     * Wrapper to allow z modules to work with AMD style requires.
     * (don't call directly: bound with 'z.Application#bindApi' 
     * and available in the global scope as 'define')
     *
     * @package z.module
     * @param {String} name (optional)
     * @param {Array} reqs
     * @param {Function} factory
     * @return {Undefined}
     */
    _amdDefine: function(name, reqs, factory){

      if(2 === arguments.length){
        factory = reqs;
        reqs = name;
        name = undefined;
      }

      if(1 === arguments.length){
        factory = name;
        reqs = [];
        name = undefined;
      }

      var mod = this.add(name);

      z.util.each(reqs, function(req){
        mod.imports(req.split('/').join('.'));
      });

      mod.exports(function(__){
        var args = [];
        for(var dep in __){
          args.push(__[dep]);
        }

        var noConflictExports = root.exports // save the exports func.
          , noConflictModule = root.module
          , result;

        root.exports = {}; // Allows the use of exports.
        root.module = {}; // Allows the use of module.exports
        result = factory.apply(this, args);

        if(false === z.util.empty(root.exports)){
          result = root.exports;
        }

        if(root.module.exports){
          result = root.module.exports;
        }

        root.exports = noConflictExports;
        root.module = noConflictModule;

        return result;
      });
    },

    /**
     * Shortcut to define modules without naming them first.
     * (don't call directly: bound with 'z.Application#bindApi' 
     * and available in the global scope as 'imports')
     *
     *  imports('app.module')
     *  .exports(function(__){ 
     *    console.log(__.hasOwnProperty('module')); // true 
     *  });
     *
     * @returns {Module}
     */
    _apiImports: function(){
      var mod = this.add();
      return Module.prototype.imports.apply(mod, arguments);
    },

    /**
     * Shortcut to define modules without any imports.
     * (don't call directly: bound with 'z.Application#bindApi' 
     * and available in the global scope as 'exports')
     *
     *  exports(function(){ 
     *    return{ 
     *      myModule = function(){ ... }
     *    }
     *  });
     *
     * @returns {Module}
     */
    _apiExports: function(cb){
      return this.add().exports(cb);
    }

  });

  /**
   * Constants
   */
  var MODULE_STATUS = {
    PENDING: 0,
    ENABLED: 1,
    IMPORTING: 2,
    DEFINED: 3,
    REJECTED: -1
  };

  /**
   * Modules are wrappers around each module that handle
   * dependencies, callbacks, and so forth.
   *
   * Create using z.Application#add(name) rather then calling directly.
   *
   * @api private
   */
  var Module = z.Class({

    /**
     * Set up instance variables.
     *
     * @return {Undefined}
     */
    __init__: function(){
      // Module#definition is where the completed module will be placed 
      // after all dependencies are loaded.
      this.definition = null;
      // Module#factory is where the factory callback is saved before 
      // dependencies are loaded.
      this.factory = null;
      // Module#deps is an iterator of required modules.
      this.deps = new z.util.Iterator;
      // Module#compiled is used by Module#compiles. If present, this will be
      // used when '$ z together' is run instead of Module#definition to create
      // a module WITHOUT dependencies. Use this only if you are creating a module
      // that can compile to a stand-alone script (such as with z.Plus)
      this.compiled = false;

      this._state = MODULE_STATUS.PENDING;
    },

    /**
     * Import items from an external module.
     *
     * @param {String || Object} from Items to import
     * @return {Object}
     */
    imports: function(from){
      
      var self = this
        , dep = {}
        ;

      if(arguments.length >= 2){
        for(var i=0; i < arguments.length; i++){
          this.imports(arguments[i]);
        }
        return this;
      }

      if(typeof from === 'object'){
        if(!from.hasOwnProperty('as')){
          from.as = 'script';
        }
        if('*' === from.uses || undefined === from.uses){
          from.uses = false;
        }
        if(false === from.uses instanceof Array && false !== from.uses){
          from.uses = [from.uses];
        }
        dep = from;
      } else {
        dep = {
          from: from,
          uses: false,
          as: 'script'
        }
      }

      // Get the url
      dep.url = (dep.url || z.App.findUrl(dep));

      this.deps.push(dep);

      return this;

    },

    /**
     * Define the module by passing a callback.
     * The object passed to the callback will contain
     * the requested dependecies. You can name this argument
     * anything you desire, but convetionally it is
     * named '__', a double-underscore (or 'DUS' for short). 
     * Example:
     *  z.module('mymodule')
     *  .imports({from:'app.Foo', uses:'*'})
     *  .exports(function(__){
     *     console.log(__.hasOwnProperty('Foo')); // true 
     *  });
     * 
     * @param {Function} factory
     * @return {this}
     */
    exports: function(factory){

      var self = this
        ;

      if(typeof factory === 'function'){
        this.factory = factory;
      } else {
        this.factory = function(){
          return factory;
        }
      }

      if(z.config.module.env === 'browser'
        && !z.App.isPending() ){
        z.App.start();
      }

      return this;
    },

    /**
     * Enable the module.
     *
     * @param {Function} next
     * @return {this}
     */
    enable: function(next){

      var self = this
        , stop = false;

      var promise = new z.Promise(function(res, rej){

        if(self.isRejected()){
          rej('Cannot enable a rejected module');
          return;
        }

        if(self.isDone()){ // can only change from a pending state.
          res();
          return;
        }

        self._checkState();

        if(self.isPending()){
          self._import(res, rej);
          return;
        }

        self._define(res, rej);

      });

      if(z.u(next).isFunction()){
        promise.then(next);
      }

      promise.catches(function(e){
        self._state = MODULE_STATUS.REJECTED;
        return e;
      });

      return promise;

    },

    /**
     * Create a stand-alone script when compiling modules together.
     *  exports(function(__){
     *    return {
     *      foo: 'foo',
     *      bar: 'bar'
     *    };
     *  }).compiles(function(module){
     *    return module.foo;
     *  });
     *
     * @param {Function} factory A function to create the compiled module.
     *   The first arg is the module definition.
     */
    compiles: function(factory){
      if(typeof factory !== 'function'){
        return;
      }

      this.compiled = function(){
        return factory(this.definition);
      }
    },

    isPending: function(){
      return this._state === MODULE_STATUS.PENDING;
    },

    isEnabled: function(){
      return this._state === MODULE_STATUS.ENABLED;
    },

    isRejected: function(){
      return this._state === MODULE_STATUS.REJECTED;
    },

    isDefined: function(){
      return this._state === MODULE_STATUS.DEFINED;
    },

    isImporting: function(){
      return this._state === MODULE_STATUS.IMPORTING;
    },

    isDone: function(){
      return 
        this._state === MODULE_STATUS.ENABLED ||
        this._state === MODULE_STATUS.REJECTED;
    },

    /**
     * Check to make sure all deps are loaded.
     */
    _checkState: function(){
      if(this.isDone() || this.isImporting()){
        return;
      }
      var done = true;
      this.deps.each(function(item){
        if(false === z.module.has(item.from)){
          this._state = MODULE_STATUS.PENDING;
          done = false;
          return true // no need to check every one
        }
      });
      if(done){
        this._state === MODULE_STATUS.ENABLED;
      }
    },

    /**
     * Load dependencies.
     *
     * @param {Function} res Resolver for the calling promise
     * @param {Function} rej Rejector for the calling promise
     * @api private
     */
    _import: function(res, rej){
      var self = this
        , queue = [];

      this._state = MODULE_STATUS.IMPORTING;

      this.deps.each(function(item){
        if(false === z.App.has(item.from)){
          queue.push(item);
        }
      });

      var len = queue.length
        , remaining = len;

      if(len > 0){
        z.util.each(queue, function(item, index){

          try{
            var as = (item.as || 'script')
              , loader = z.App._usePlugin(as);

            loader(self, item)
            .then(function(response){
              remaining -= 1;
              if(remaining <=0 ){
                self._state = MODULE_STATUS.DEFINED;
                self.enable().then(res);
              }
            })
            .catches(rej);

          } catch(e) {
            // If a plugin is not found, an error will be thrown.
            self._state = MODULE_STATUS.REJECTED;
            rej(e);
          }

        });
      } else {
        self._state = MODULE_STATUS.DEFINED;
        this.enable().then(res, rej);
      }

    },

    /**
     * Run the factory.
     *
     * @param {Function} res Resolver for the calling promise
     * @param {Function} rej Rejector for the calling promise
     * @api private
     */
    _define: function(res, rej){

      var self = this
        , stop = false
        , context = {};

      // Make sure each of the deps has been enabled. If any need to be enabled, stop loading and
      // enable them.
      this.deps.each(function(dep){
        var current = z.App.get(dep.from, dep.uses);

        if(false === current){

          z.App._modules[dep.from].enable()
          .then(function(){
            self.enable().then(res, rej);
          }, rej);

          stop = true;
          return true;
        }

        for(var key in current){
          context[key] = current[key];
        }

      });

      if(true === stop){
        return;
      }

      try {
        if(z.config.env !== 'server'){
          if(typeof this.factory === 'function'){
            this.definition = this.factory(context);
          } else {
            this.definition = this.factory;
          }
        } else {
          // If we're in a node.js env we don't want to execute the factory.
          // However, if the defintion is null z.module.start() will stall,
          // so we need to set it to 'true'
          this.definition = true;
        }
      } catch(e) {
        self._state = MODULE_STATUS.REJECTED;
        rej(e);
        return;
      }

      this._state = MODULE_STATUS.ENABLED;
      res();

      return;
    }

  });

  /**
   * Module API
   */

  /**
   * The app instance.
   */
  z.App = new z.Application(z.config.module);

  /**
   * Create a new, nammed module.
   *   
   * @param {String} classname A period delimited name for the module.
   *   If left blank, the last used request will name the module 
   *   (simmilar to how AMD works).
   * @return {Module}
   * @package z.module
   */
  z.module = function(moduleName){
    return z.App.add(moduleName);
  }

  /**
   * alias for z.App.start
   *
   * @return {z.Promise}
   */
  z.module.start = function(next){
    return z.App.start(next);
  }

  /**
   * Alias for z.App.setup
   *
   * @param {Object} config
   */
  z.module.setup = function(config){
    z.App.setup(config);
  }
  
  /**
   * Checks if a module has been loaded.
   *
   * @param {String} moduleName
   * @return {Boolean}
   */
  z.module.has = function(moduleName){
    return z.App.has(moduleName);
  }

  /**
   * Get items from a module.
   */
  z.module.get = function(from, uses){
    return z.App.get(from, uses);
  }

  /**
   * Find a URL from a z request.
   */
  z.module.findUrl = function(req){
    return z.App.findUrl(req);
  }

  /**
   * Plugins for z's loader.
   *
   * @param {String} name
   * @param {Function} cb
   */
  z.module.plugin = function(name, cb){
    z.App.plugin(name, cb);
  }

  /**
   * The default plugin, used for loading js files.
   */
  z.module.plugin('script', function(req, res, rej){
    var name = req.from
      , self = this;

    if(z.Scripts.isPending(req.url)){
      return;
    }

    z.Scripts.load(req, function(node){
      z.App._ensureModule(name);
      res();
    }, function(reason){
      rej('Could not load script ' + name);
    });
  });

  /**
   * Load other files.
   */
  z.module.plugin('file', function(req, res, rej){
    var name = req.from
      , self = this
      , mod = z.module(name); // The module that will wrap the file.
    req.method = 'GET';
    z.Ajax.request(req)
    .then(function(data){
      mod.exports(function(){ return data; });
      res();
    })
    .catches(rej);
  });