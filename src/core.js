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
  if(u.isFunction(name)){
    factory = name;
    name = undef;
  }
  if(z.has(name) && !factory){
    return z.modules[name];
  }
  var mod = _addModule(name);
  if(u.isFunction(factory) && factory.length === 2){
    _runFactory(mod, factory);
  } else if (factory) {
    mod.exports(factory);
  }
  return mod;
}

/**
 * `z` is aliased as `module` to allow for more readable code.
 * Run z.noConflict() to return `module` to its original owner.
 */
var _lastModule = root.module;
root.module = z;

/**
 * Return `module` to its original owner.
 */
z.noConflict = function(){
  root.module = _lastModule;
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
    if(_useInteractive){
      // For < IE9 (and 10, apparently -- seems to get called there too)
      // I think this is because <IE9 runs onload callbacks BEFORE the code
      // executes, while other browsers do it right after.
      node = _currentlyAddingScript || Script.getInteractiveScript();
      name = node.getAttribute('data-from');
    } else {
      // Assign to a temp cache, to be named by the onload callback.
      _tmpModule = new Module();
      return _tmpModule;
    }
  }

  z.modules[name] = new Module();
  return z.modules[name];
}

/**
 * Helper for running module factories.
 *
 * @param {Module} mod
 * @param {Function} factory
 * @api private
 */
var _runFactory = function(mod, factory){
  var imports = function(){
    return Module.prototype.imports.apply(mod, arguments);    
  }
  var exports = function(){
    return Module.prototype.exports.apply(mod, arguments);
  }
  factory.call(mod, imports, exports);
}

/**
 * Anonymous modules are stored here until they can be named.
 *
 * @var {Module | null}
 * @api private
 */
var _tmpModule = null;

/**
 * All modules are registered here.
 *
 * @var {Object}
 */
z.modules = {};

/**
 * Check to see if a module exists in the registry.
 *
 * @param {String} name
 */
z.has = function(name){
  return z.modules.hasOwnProperty(name);
}

/**
 * This method checks _tmpModule and assigns the name provided
 * if it finds a module there. Should be called by plugins in
 * their onLoad callbacks.
 *
 * @param {String} name
 */
z.ensureModule = function(name){
  var tmp = _tmpModule;
  if(null === tmp){
    return;
  }
  _tmpModule = null;
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