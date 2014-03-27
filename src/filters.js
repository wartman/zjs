/**
 * ----------------------------------------------------------------------
 * Default filters
 */

/**
 * Search for a matching pattern and replace.
 *
 * @example
 * z.setup({
 *   'foo.bar': 'root.foo.bar'
 * });
 */
z.filter('alias', function(req, filters){

  var nsTest = new RegExp('[' + req.from.replace(/\./g, '\\.') + ']+?')
    , search = false
    , replace = '';

  for (var key in filters){
    if(nsTest.test(key)){
      search = key;
      replace = filters[key];
    }
  }

  if(!search){
    return req;
  }

  req.fromAlias = req.from.replace(search, replace);

  return req;

});

/**
 * Basic shim support.
 */
z.filter('shim', function(req, filters){

  if(!filters.hasOwnProperty(req.from)){
    return req;
  }

  var ext = (req.options.ext || this.options.ext)

  if(u.isFunction(filters[req.from])){
    return filters[req.from](req);
  }

  req.src = z.config.root + filters[req.from].src + '.' + ext;
  return req;

});

/**
 * Get a src from a request.
 */
z.filter('src', function(req){

  if(req.src){
    return req;
  }

  var name = (req.fromAlias || req.from)
    , ext = (req.options.ext || this.options.ext)
    , src = name.replace(/\./g, '/');

  src = z.config.root + src + '.' + ext;
  src = src.trim();

  req.src = src;
  return req;

});

/**
 * Method filter
 *
 * @param {Object} req
 */
z.filter('ajaxMethod', function(req){
  req.method = (req.method || this.options.method);
  return req;
});