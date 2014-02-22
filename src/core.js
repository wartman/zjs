/**
 * ----------------------------------------------------------------------
 * z API
 */

/**
 * The top-level API for z
 *
 * @param {String | Function} name The module name. If this is the only arg given,
 *   and the name exists in the registry, this will return an existing module.
 *   If you pass a function here, you will define a ananymous module with no deps.
 * @param {Function} factory Pass a function here to quickly define a module
 *   with no deps.
 */
var z = root.z = function(name, factory){
  if(z.has(name) && !factory){
    return z.modules[name];
  }
  if(u.isFunction(name)){
    factory = name;
    name = undef;
  }
  var mod = _addModule(name);
  if(factory){
    mod.exports(factory);
  }
  return mod;
}

/**
 * Helper for adding modules.
 *
 * @param {String} name
 * @return {Module}
 * @api private
 */
var _addModule = function(name){
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
 * All modules are registered here.
 *
 * @var {Object}
 */
z.modules = {};

/**
 * Anonymous modules are stored here until they can be named.
 *
 * @var {Module | null}
 */
z.tmp = null;

/**
 * Check to see if a module exists in the registry.
 *
 * @param {String} name
 */
z.has = function(name){
  return z.modules.hasOwnProperty(name);
}

/**
 * This method checks z.tmp and assigns the name provided
 * if it finds a module there. Should be called by plugins in
 * their onLoad callbacks.
 *
 * @param {String} name
 */
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

/**
 * The app configuration.
 *
 * @var {Object}
 */
z.config = {
  root: '',
  shim: {},
  alias: {},
  env: 'browser'
};

/**
 * Configure z
 *
 * @param {Object} options
 */
z.setup = function(options){
  z.config = u.defaults(z.config, options);
}

/**
 * Expose util funcs.
 */
z.u = z.util = u;

/**
 * The plugin registry.
 *
 * @var {Object}
 */
z.plugins = {};

/**
 * Plugable factory. If the only arg provided is [name], and
 * a plugin of that name exists, this will return a plugin.
 *
 * @param {String} name Set or get a plugin of this name.
 * @param {Loader} loader The loader class to use.
 * @param {Function} loadEvent The event to trigger on load
 * @param {Object} options
 * @throws {Error} If no plugin of the requested name is found.
 * @return {Plugable}
 */
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
 * Load a script.
 *
 * @param {Object} req
 * @param {Function} next
 * @param {Function} err
 * @return {Script}
 */
z.script = function(req, next, error){
  var scr = new Script(req, z.config.script);
  scr.ready(next, error);
  return scr;
}

/**
 * Send an AJAX request.
 *
 * @param {Object} req
 * @param {Function} next
 * @param {Function} err
 * @retrun {Ajax}
 */
z.ajax = function(req, next, err){
  var ajx = new Ajax(req, z.config.ajax);
  ajx.ready(next, err);
  return ajx;
}