/**
 * ----------------------------------------------------------------------
 * z.Module
 *
 * z's module loading system.
 * Compatable with AMD.
 */

var MODULE_STATE = {
  PENDING: 0,
  LOADED: 1,
  ENABLED: 2,
  FAILED: -1
};

var Module = function(deps){
  this._deps = (deps && u.isArray(deps))? deps : [];
  this._state = MODULE_STATE.PENDING;
  this._factory = null;
  this._definition = null;
  this._onReady = [];
  this._onFailed = [];
}

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
      item.replace(_alias, function(match, actual, replace){
        name = actual.trim();
        alias = replace.trim();
        return match;
      });
    }
    if(self._definition.hasOwnProperty(name)){
      (single)?
      ctx = self._definition[name] :
      ctx[alias] = self._definition[name];
    }
  });

  return ctx;
}

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

  dep.url = _findUrl(dep);

  this._deps.push(dep);

  return this;
}

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

Module.prototype.enable = function(next, error){
  this.ready(next, error);
  _resolve(this);
  return this;
}

Module.prototype.ready = function(onReady, onFailed){
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

Module.prototype.fail = function(onFailed){
  return this.ready(undef, onFailed);
}

u.each(['Enabled', 'Loaded', 'Pending', 'Failed'], function(state){
  Module.prototype['is' + state] = function(){
    return this._state === MODULE_STATE[state.toUpperCase()];
  } 
});

var _alias = /([\s\S]+?)\@([\s\S]+?)$/g;

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

  // TODO:
  // Check z's global state before continuing.

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
    // Dispatch the ready queue.
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
      try{
        var type = (item.options.type || 'script')
          , loader = z.plugin(type);

        loader(item, function(){
          remaining -= 1;
          if(remaining <=0 ){
            _resolve(mod, MODULE_STATE.LOADED);
          }
        }, function(e){
          _resolve(mod, MODULE_STATE.FAILED);
          throw e;
        });
      } catch(e) {
        // If a plugin is not found, an error will be thrown.
        _resolve(mod, MODULE_STATE.FAILED);
        throw e;
      }
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
      current.enable().ready(function(){
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

_findUrl = function(req){
  var shim = z.config.shim
    , alias = z.config.alias
    , name = req.from
    , ext = (req.options.ext || 'js')
    , nameParts = name.split('.')
    , changed = false
    , src = '';

  u.each(nameParts, function(part, index){
    if(alias.hasOwnProperty(part)){
      nameParts[index] = alias[part];
    }
  });

  name = nameParts.join('.');
  if(shim.hasOwnProperty(name)){
    src = shim[name].src;
  } else {
    src = name.replace(/\./g, '/');
    src = z.config.root + src + '.' + ext;
  }

  return src;
}