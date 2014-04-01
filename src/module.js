/**
 * ----------------------------------------------------------------------
 * z.Module
 *
 * The core of z.
 * 
 * This class will never be called directly -- instead, use z's constructor to
 * add and retrieve modules.
 *
 * @example:
 *
 *  z('foo.bar').
 *  imports('foo.bin', ['Bar @ Foo', 'Bin']).
 *  imports('foo.baz', 'Bar').
 *  exports(function(__){
 *    // code
 *  });
 */

var MODULE_STATE = {
  PENDING: 0,
  LOADED: 1,
  ENABLED: 2,
  FAILED: -1
};

/**
 * The module constructor.
 */
var Module = function(){
  this._deps = [];
  this._state = MODULE_STATE.PENDING;
  this._factory = null;
  this._definition = null;
  this._onReady = [];
  this._onFailed = [];
}

/**
 * Regexp to parse aliases.
 *
 * @var {RegExp}
 * @api private
 */
var _alias = /\s?([\S]+?)\s?\@\s?([\S]+?)\s?$/;

/**
 * Check the module's definition and return requested item(s)
 *
 * @param {String | Array} items An item or items that you want from this module.
 *   Passing a string will always return a single item, an array returns an object.
 *   You can alias items with '@'. For example:
 *     z('myModule').get(['foo @ bar', 'baz']);
 *   This will return an object where 'bar' will alias 'foo'. Note that if you
 *   pass a string the alias will be ignored.
 * @return {Object | Mixed}
 */
Module.prototype.use = function(items){
  if(!this.isEnabled()){
    return false;
  }

  var self = this
    , single = false
    , ctx = {};

  if(!items){
    return this._definition;
  }

  if(!u.isArray(items)){
    single = true;
    items = [items];
  }

  u.each(items, function(item){
    var alias = item
      , name = item;
    if(_alias.test(item)){
      item.replace(_alias, function(match, actual, replace, index){
        name = actual;
        alias = replace;
        return match;
      });
    }
    if(self._definition.hasOwnProperty(name)){
      if(single){
        ctx = self._definition[name];
      } else {
        ctx[alias] = self._definition[name];
      }
    }
  });

  return ctx;
}

/**
 * Import modules.
 *
 * @param {String} from The name of a module, using period-delimited
 *   syntax. A loader will map this name to an url later. If this is the
 *   only arg provided (or [uses] indicates you want the entire module:
 *   see below) this module will be available, by default, using the last
 *   segment of the name.
 *      imports('foo.bar') ... -> imports as 'bar'
 *   Alternately, you can alias the name with '@'.
 *      imports('foo.bar @foo') ... -> imports as 'foo'
 *   If [uses] is defined, then the alias will be ignored.
 * @param {String | Array | Boolean} uses Specific item or items you want
 *   from the module. 
 *      imports('foo.bar', 'Bin') ... -> imports Bin from foo.bar
 *      imports('foo.bar', ['Bin', 'Ban']) ... -> imports Bin and Ban from foo.bar.
 *   Passing '*', 'false' or leaving this arg undefined will return the entire module.
 *      imports('foo.bar', '*') ... -> imports as 'bar' 
 *   Items requested here can be also be aliased using '@'.
 *      imports('foo.bar', ['Bin @ foo', 'Ban']) ... -> imports Bin (as 'foo') and Ban from foo.bar.
 * @param {Object} options Allows you to further modify the import request. A common
 *    example will be to use a plugin.
 *      imports('foo.bar', '*', {type:'ajax', ext:'txt'}) ... -> Import a txt file
 * @return {this}
 */
Module.prototype.imports = function(from, uses, options){

  this._state = MODULE_STATE.PENDING;

  var alias = false;
  if(_alias.test(from)){
    var ret = from;
    ret.replace(_alias, function(match, actual, replace){
      from = actual.trim();
      alias = replace.trim();
    });
  }

  uses = (!uses || '*' === uses)? false : (!u.isArray(uses))? [uses] : uses;
  options = u.defaults({type:'script'}, options);

  var dep = {
    from:from,
    alias:alias,
    uses:uses,
    options:options
  };

  this._deps.push(dep);

  return this;
}

/**
 * Define module exports.
 *
 * @param {String} name (optional) If a name is passed, then [factory]
 *   will define [name] in the module definition.
 * @param {Function} factory A callback to define the module (or
 *   module component, if [name] is passed).
 * @example:
 *   TODO
 * @return {this}
 */
Module.prototype.exports = function(name, factory){

  var self = this;

  if(arguments.length <= 1){
    factory = name;
    name = false;
  }

  if(!name){
    this._factory = factory;
  } else {
    if(null === this._factory) this._factory = {};
    this._factory[name] = factory;
  }

  u.async(function(){
    self.enable();
  });

  return this;
}

/**
 * Enable the module.
 *
 * @param {Function} next (optional)
 * @parma {Function} error (optional)
 */
Module.prototype.enable = function(next, error){
  this.done(next, error);

  if(this.isPending()){
    _import.call(this);
    return this;
  }

  if(this.isLoaded()){
    _define.call(this);
    return this;
  }

  if(this.isFailed()){
    // dispatch the failed queue.
    _dispatch.call(this, this._onFailed, this);
    this._onFailed = [];
    return this;
  }

  if(this.isEnabled()){
    // Dispatch the done queue.
    _dispatch.call(this, this._onReady, this);
    this._onReady = [];
  }

  return this;
}

/**
 * Disable the module
 */
Module.prototype.disable = function(error){
  this.isFailed(true);
  return this.enable();
}

/**
 * Callbacks to fire once the module has loaded all dependencies. 
 * If called on a enabled module, the callback will be fired immediately.
 *
 * @param {Function} onReady
 * @param {Function} onFailed
 */
Module.prototype.done = function(onReady, onFailed){
  var self = this;
  u.async(function(){
    if(onReady && u.isFunction(onReady)){
      (self.isEnabled())?
        onReady.call(self):
        self._onReady.push(onReady);
    }
    if(onFailed && u.isFunction(onFailed)){
      (self.isFailed())?
        onFailed.call(self):
        self._onFailed.push(onFailed);
    }
    return this;
  });
}

/**
 * Shortcut for Module#done(undefined, onFailed)
 *
 * @param {Function} onFailed
 */
Module.prototype.fail = function(onFailed){
  return this.done(undef, onFailed);
}

/**
 * Set up methods for checking the module state.
 */
u.each(['Enabled', 'Loaded', 'Pending', 'Failed'], function(state){
  var modState = MODULE_STATE[state.toUpperCase()];
  /**
   * Check module state.
   *
   * @param {Boolean} state If true, will set the state.
   * @return {Boolean}
   */
  Module.prototype['is' + state] = function(set){
    if(set) this._state = modState;
    return this._state === modState;
  } 
});

/**
 * Helper to dispatch a function queue.
 *
 * @param {Array} fns
 * @param {Object} ctx
 * @api private
 */
var _dispatch = function(fns, ctx){
  u.each(fns, function(fn){
    fn.call(ctx);
  });
}

/**
 * Import a module's deps.
 *
 * @api private
 */
var _import = function(){
  var queue = []
    , self = this;

  u.each(this._deps, function(item){
    if(false === z.has(item.from)){
      queue.push(item);
    }
  });

  var remaining = queue.length;

  if(remaining > 0){
    
    u.each(queue, function(item, index){

      item = z.runFilters('all', item);

      var type = (item.options.type || 'script')
        , loader = z.loader(type);

      loader.load(item, function(){
        remaining -= 1;
        if(remaining <=0 ){
          self.isLoaded(true);
          self.enable();
        }
      }, function(e){
        self.disable();
        throw e;
      });

    });

  } else {
    this.isLoaded(true);
    this.enable();
  }
}

/**
 * Define a module (that is, run its factory)
 *
 * @api private
 */
var _define = function(){
  var context = {}
    , self = this;

  // Make sure each of the deps has been enabled. If any need to be enabled, stop loading and
  // enable them.
  u.each(this._deps, function(dep){

    if(!context){
      return;
    }

    if(!z.has(dep.from)){
      throw new Error('A dependency is not in the registry: '+ dep.from);
    }

    var current = z(dep.from)
      , parts = {};

    if(current.isFailed()){
      self.disable();
      throw new Error('A dependency failed: '+ dep.from);
      context = false;
      return true;
    }

    if(!current.isEnabled()){
      current.enable().done(function(){
        self.enable();
      });
      context = false;
      return true;
    }

    if(dep.uses){
      parts = current.use(dep.uses);
    } else {
      if(dep.alias){
        parts[dep.alias] = current._definition;
      } else {
        parts[dep.from.split('.').pop()] = current._definition;
      }
    }

    context = u.extend(context, parts);
  });

  if(!context){
    return;
  }

  try {
    if(z.config.env !== 'server'){
      if(u.isFunction(this._factory)){
        this._definition = this._factory(context);
      } else if(u.isObject(this._factory)) {
        this._definition = {};
        u.each(this._factory, function(item, key){
          if(u.isFunction(item)){
            self._definition[key] = item(context)
          } else {
            self._definition[key] = item;
          }
        })
      } else {
        this._definition = this._factory;
      }
    } else {
      // If we're in a node.js env we don't want to execute the factory.
      this._definition = true;
    }
  } catch(e) {
    this.disable();
    throw e;
    return;
  }
  this.isEnabled(true);
  this.enable();
}

/**
 * Module API in src/core.js
 