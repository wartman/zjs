/**
 * The top-level API for z
 */
var z = root.z = function(name, factory){
  if(z.has(name) && !factory){
    return z.modules[name];
  }
  if(u.isFunction(name)){
    factory = name;
    name = undef;
  }
  var mod = _add(name);
  if(factory){
    mod.exports(factory);
  }
  return mod;
}

/**
 * Helper for adding modules.
 */
var _add = function(name){
  if(typeof name === "undefined"){
    var node;
    if(Script.useInteractive){
      // For < IE9 (and 10, apparently -- seems to get called there too)
      // I think this is because <IE9 runs onload callbacks BEFORE the code
      // executes, while other browsers do it right after.
      node = Script.currentlyAddingScript || Script.getInteractiveScript();
      name = node.getAttribute('data-from');
    } else {
      // Assign to a temp cache, to be named by the onload callback.
      z.tmp = new Module();
      return z.tmp;
    }
  }

  z.modules[name] = new Module();
  return z.modules[name];
}

/**
 * Expose util funcs.
 */
z.u = z.util = u;

z.modules = {};
z.plugins = {};
z.tmp = null;

/**
 * Static methods
 */

z.has = function(name){
  return z.modules.hasOwnProperty(name);
}

z.config = {
  root: '',
  shim: {},
  alias: {},
  env: 'browser'
};
z.setup = function(options){
  z.config = u.defaults(z.config, options);
}

z.ensureModule = function(name){
  var tmp = z.tmp;
  if(null === tmp){
    return;
  }
  z.tmp = null;
  if(!tmp instanceof Module){
    return;
  }
  z.modules[name] = tmp;
  return;
}

_loadQueue = 0;
z.isLoading = function(state){
  return _loadQueue.length >= 0;
}
z.addLoading = function(){
  _loadQueue += 1;
}
z.doneLoading = function(){
  _loadQueue -= 1;
}

z.script = function(req, next, error){
  var scr = new Script(req, z.config.script).ready(next, error);
  return scr;
}

z.ajax = function(req, next, error){
  var ajx = new Ajax(req, z.config.ajax)
  ajx.ready(next, error);
  return ajx;
}

z.plugin = function(name, loader, loadEvent, options){
  if(arguments.length <= 1){
    if(z.plugins.hasOwnProperty(name)){
      return z.plugins[name];
    }
    throw new Error('Plugin was not found: '+name);
    return false;
  }

  z.plugins[name] = new Plugable(loader, loadEvent, options);
  return z.plugins[name];
}

/**
 * Shortcuts
 */
root.imports = function(from, uses, options){
  return z().imports(from, uses, options);
}