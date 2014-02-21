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

z.script = function(req, next, error){
  var scr = new Script(req, z.config.script).ready(next, error);
  return scr;
}
z.script.isPending = function(url){
  return Script.isPending(url);
}

z.ajax = function(req, next, error){
  var ajx = new Ajax(req, z.config.ajax)
  ajx.ready(next, error);
  return ajx;
}

z.plugin = function(name, plugin){
  if(!plugin){
    if(z.plugins.hasOwnProperty(name)){
      return z.plugins[name];
    }
    throw new Error('Plugin was not found: '+name);
    return false;
  }

  if(!u.isFunction(plugin)){
    throw new TypeError('[plugin] must be a function or undefined: '+typeof plugin);
    return false;
  }

  z.plugins[name] = plugin;
  return z.plugins[name];
}

/**
 * Shortcuts
 */
root.imports = function(from, uses, options){
  return z().imports(from, uses, options);
}