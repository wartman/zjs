/**
 * ----------------------------------------------------------------------
 * Plugable
 *
 * A wrapper for z plugins. Primarily ensures items are not loaded more then once.
 * This particular system is highly unstable -- I think there are much better
 * ways of making this user friendly, so it will likely change a lot.
 * For now, just use the provided 'script' and 'ajax' plugins.
 */

/**
 * Plugable is used by z.plugin to handle loading events.
 *
 * @param {Loader} loader A loader class. Requires a 'load' method
 *   and a 'done' method. See z.Loader for an example of how to
 *   create a compatable class.
 * @param {Function} loadEvent The callback that will be triggered
 *   when the module is loaded.
 * @param {Object} options Default options for requests.
 */
var Plugable = function(loader, loadEvent, options){
  this._queue = {};
  this._loader = loader;
  this.options = u.defaults(this.options, options);
  this._loadEvent = loadEvent;
}

/**
 * The default options for a request.
 * Currently, you can set 'ext' to change the default extension,
 * and 'req' to modifiy all request objects.
 *
 * This is subject to change!
 *
 * @var {Object}
 */
Plugable.prototype.options = {
  ext: 'js'
};

/**
 * Create an URL using this plugables options.
 *
 * @param {Object} request
 * @api private
 */
Plugable.prototype._makeUrl = function(req){
  var shim = z.config.shim
    , alias = z.config.alias
    , name = req.from
    , ext = (req.options.ext || this.options.ext)
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

/**
 * Add a request to the queue.
 * 
 * @param {String} url
 * @param {Loader} obj
 */ 
Plugable.prototype.enqueue = function(url, obj){
  this._queue[url] = obj;
}

/**
 * Check the queue to see if an url is loading.
 *
 * @param {String} url
 */
Plugable.prototype.has = function(url){
  return this._queue.hasOwnProperty(url)
}

/**
 * Load a request.
 *
 * @param {Object} req
 * @param {Function} next
 * @param {Function} error
 */
Plugable.prototype.load = function(req, next, error){
  var self = this;
  if(!req.url){
    req.url = this._makeUrl(req);
  }
  if(this.options.req){
    req = u.defaults(this.options.req, req);
  }

  // Ensure that we only load an item once.
  // If a module requests the same URL again, have it subscribe to the 
  // request alreay in progress.
  if(!this.has(req.url)){
    this.enqueue(req.url, new this._loader(req));
  }
  this._queue[req.url].done(function(res){
    self._loadEvent(req, res, next, error);
  }, error);
}