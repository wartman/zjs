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
 *
 * @param {Array} deps This arg is only used by the zjs optimizer.
 */
var Module = function(deps){
  this._deps = (deps && u.isArray(deps))? deps : [];
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
  if(!from){
    throw new TypeError('{from} must be defined');
  }

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
  if(arguments.length <= 1){
    factory = name;
    name = false;
  }

  var self = this;

  if(!name){
    this._factory = factory;
  } else {
    if(null === this._factory) this._factory = {};
    this._factory[name] = factory;
  }

  setTimeout(function(){
    _resolve(self);
  }, 0); // Make sure all exports are defined first.

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
  _resolve(this);
  return this;
}

/**
 * Callbacks to fire once the module has loaded all dependencies. 
 * If called on a enabled module, the callback will be fired immediately.
 *
 * @param {Function} onReady
 * @param {Function} onFailed
 */
Module.prototype.done = function(onReady, onFailed){
  if(onReady && u.isFunction(onReady)){
    (this.isEnabled())?
      onReady.call(this) :
      this._onReady.push(onReady);
  }
  if(onFailed && u.isFunction(onFailed)){
    (this.isFailed())?
      onFailed.call(this):
      this._onFailed.push(onFailed);
  }
  return this;
}

/**
 * Shortcut for Module#done(undefined, onFailed)
 *
 * @param {Function} onFailed
 */
Module.prototype.fail = function(onFailed){
  return this.done(undef, onFailed);
}

u.each(['Enabled', 'Loaded', 'Pending', 'Failed'], function(state){
  Module.prototype['is' + state] = function(){
    return this._state === MODULE_STATE[state.toUpperCase()];
  } 
});

/**
 * Helper to dispatch a function queue.
 *
 * @param {Array} fns
 * @param {Object} ctx
 */
var _dispatch = function(fns, ctx){
  u.each(fns, function(fn){
    fn.call(ctx);
  });
}

/**
 * Resolve a module
 *
 * @param {Module} mod
 * @param {MODULE_STATE} state (optional)
 */
var _resolve = function(mod, state){
  if(state){
    mod._state = state
  }

  if(mod.isPending()){
    _import(mod);
    return;
  }

  if(mod.isLoaded()){
    _define(mod);
    return;
  }

  if(mod.isFailed()){
    // dispatch the failed queue.
    _dispatch(mod._onFailed, mod);
    mod._onFailed = [];
    return;
  }

  if(mod.isEnabled()){
    // Dispatch the done queue.
    _dispatch(mod._onReady, mod);
    mod._onReady = [];
  }
}

/**
 * Import a module's deps.
 *
 * @param {Module} mod
 */
var _import = function(mod){
  var queue = [];

  u.each(mod._deps, function(item){
    if(false === z.has(item.from)){
      queue.push(item);
    }
  });

  var remaining = queue.length;

  if(remaining > 0){
    
    u.each(queue, function(item, index){
      var type = (item.options.type || 'script')
        , loader;

      try {
        loader = z.plugin(type);
      } catch(e) {
        // If a plugin is not found, an error will be thrown.
        _resolve(mod, MODULE_STATE.FAILED);
        throw e;
      }

      loader.load(item, function(){
        remaining -= 1;
        if(remaining <=0 ){
          _resolve(mod, MODULE_STATE.LOADED);
        }
      }, function(e){
        _resolve(mod, MODULE_STATE.FAILED);
        throw e;
      });

    });
  } else {
    _resolve(mod, MODULE_STATE.LOADED);
  }
}

/**
 * Define a module (that is, run its factory)
 *
 * @param {Module} mod
 */
var _define = function(mod){
  var stop = false
    , context = {};

  // Make sure u.each of the deps has been enabled. If any need to be enabled, stop loading and
  // enable them.
  u.each(mod._deps, function(dep){

    if(!z.has(dep)){
      // error
    }

    var current = z(dep.from)
      , parts = {};

    if(current.isFailed()){
      _resolve(mod, MODULE_STATE.FAILED);
      throw new Error('A depenency failed: '+current);
      stop = true;
      return true;
    }

    if(!current.isEnabled()){
      current.enable().done(function(){
        mod.enable();
      });
      stop = true;
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

  if(true === stop){
    return;
  }

  try {
    if(z.config.env !== 'server'){
      if(u.isFunction(mod._factory)){
        mod._definition = mod._factory(context);
      } else if(u.isObject(mod._factory)) {
        mod._definition = {};
        u.each(mod._factory, function(item, key){
          if(u.isFunction(item)){
            mod._definition[key] = item(context)
          } else {
            mod._definition[key] = item;
          }
        })
      } else {
        mod._definition = mod._factory;
      }
    } else {
      // If we're in a node.js env we don't want to execute the factory.
      // However, if the defintion is null z.module.start() will stall,
      // so we need to set it to 'true'
      mod._definition = true;
    }
  } catch(e) {
    _resolve(mod, MODULE_STATE.FAILED);
    throw e;
    return;
  }
  _resolve(mod, MODULE_STATE.ENABLED);
}