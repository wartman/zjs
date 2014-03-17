/**
 * ----------------------------------------------------------------------
 * Loader
 *
 * The Loader is ultimately responsable for loading scripts, files, etc.
 * Use the API to register new loaders and filters.
 */

/**
 * Create a new Loader.
 * The setup object is where you define how the loader should function:
 * see the API under the class for more on how to set up Loaders.
 *
 * @param {Object} setup
 */
var Loader = function(setup){
  this._queue = {};
  setup = (setup || {});

  this._filters = (setup.filters || ['default.src']);
  this.options = u.defaults(this.options, setup.options);
  this._method = (setup.method || z.Script);
  this._handler = (setup.handler || function(req, res, next, error){
    next(res);
  });
  this._build = (setup.build || false);
}

/**
 * Default options.
 *
 * @var {Object}
 */
Loader.prototype.options = {
  ext: 'js'
}

/**
 * Run the request through all registered filters.
 *
 * @param {Object} req
 */
Loader.prototype.prefilter = function(req){
  var self = this;
  u.each(this._filters, function(name, index){
    var filter = z.filter(name);
    if(filter)
      req = filter.call(self, req);
  });
  return req;
}

/**
 * Register a method
 *
 * @param {Class} method
 */
Loader.prototype.method = function(method){
  this._method = method;
  return this;
}

/**
 * Register a filter or filters.
 *
 * @param {String | Array} name
 */
Loader.prototype.filters = function(name){
  if(!name){
    return;
  }
  if(u.isArray(name)){
    this._filters.concat(name);
    return;
  }
  this._filters.push(name);
  return this;
}

/**
 * Register handler.
 * Callbacks should have the args 'req', 'res', 'next' and 'error'
 *
 * @param {Function | Array} cb
 */
Loader.prototype.handler = function(cb){
  if(!cb){
    return this;
  }
  this._handler = cb;
  return this;
}

/**
 * A callback to run when in server mode
 */
Loader.prototype.build = function(cb){
  if(!cb){
    return this;
  }
  this._build = cb;
  return this;
}

/**
 * Check the queue to see if an url is loading.
 *
 * @param {String} url
 */
Loader.prototype.has = function(src){
  return this._queue.hasOwnProperty(src);
}

/**
 * Load a request.
 *
 * @param {Object} req
 * @param {Function} next
 * @param {Function} error
 * @param {Function} builder
 */
Loader.prototype.load = function(req, onDone, onRejected){
  var self = this;
  req = this.prefilter(req);
  if(!this.has(req.src)){
    this._queue[req.src] = new this._method(req);
  }
  this._queue[req.src].done(function(res){
    self._handler(req, res, onDone, onRejected);
    if(z.config.env !== 'browser' && self._build){
      z.loader.build(req, res, self);
    }
  }, onRejected);
  return this;
}

/**
 * ----------------------------------------------------------------------
 * Loader API
 */

/**
 * Holds all registered loaders.
 *
 * @var {Object}
 * @api private
 */
var _loaders = {};

/**
 * z Loader API
 * // info on how it works
 * 
 * @param {String} name If this is the only arg passed, 
 *   the method will try to return a loader or will create
 *   a new one.
 * @param {Object} setup (optional) If you pass an arg here,
 *   a new loader will be created EVEN if one already exists
 *   for the provided name.
 * @return {Loader}
 */
z.loader = function(name, setup){
  if(arguments.length <= 1){
    if(_loaders.hasOwnProperty(name)){
      return _loaders[name];
    }
  }

  _loaders[name] = new Loader(setup);
  return _loaders[name];
}

/**
 * A hook to allow the builder to interact with the loader.
 */
z.loader.build = function(req, res, loader){
  // no-op -- defined in Build.js
}

/**
 * filter API
 */
_filters = {};
z.filter = function(name, cb){
  if(arguments.length <= 1){
    if(_filters.hasOwnProperty(name)){
      return _filters[name];
    }
    return false;
  }

  _filters[name] = cb 
  return _filters[name];
}

/**
 * ----------------------------------------------------------------------
 * Default loaders and filters
 */

/**
 * Script loader
 */
z.loader('script', {
  method: z.Script,
  filters: ['default.src'],
  handler: function(req, res, next, error){
    z.ensureModule(req.from);
    next();
  },
  options: {
    ext: 'js'
  }
});

/**
 * Ajax loader
 */
z.loader('ajax', {
  method: z.Ajax,
  filters: ['default.src', 'ajax.method'],
  handler: function(req, res, next, error){
    z(req.from, function(){ return res; }).done(next, error);
  },
  options: {
    ext: 'js',
    method: 'GET'
  }
});

/**
 * Get a src from a request.
 *
 * @param {Object} req
 */
z.filter('default.src', function(req){
  if(req.src){
    return req;
  }

  var shim = z.config.shim
    , alias = z.config.alias
    , name = req.from
    , ext = (req.options.ext || this.options.ext)
    , nameParts = name.split('.')
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

  req.src = src;

  return req;
});

/**
 * Method filter
 *
 * @param {Object} req
 */
z.filter('ajax.method', function(req){
  req.method = (req.method || this.options.method);
  return req;
});