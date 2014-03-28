/**
 * ----------------------------------------------------------------------
 * Default filters
 */

/**
 * Set the plugin
 *
 * Note: not really extensable yet. Perhaps have it investigate loaders
 * and apply values based on that?
 */
var pluginTest = /([\S^\!]+?)\!/g
  , extTest = /\.([txt|json]+?)$/g
  , pluginMatch = {
      ajax: ['ajax', 'json', 'txt']
    }
z.filter('all', 'plugin', function(req, filters){

  if(!pluginTest.test(req.from)){
    return req;
  }

  req.from.replace(pluginTest, function(match, type, index, value){
    if(pluginMatch.ajax.indexOf(type) >= 0){
      req.options.type = 'ajax';
      req.options.ext = ( req.options.ext || ( (type === 'ajax')? 'json' : type ) );
    } else {
      var loader = z.loader(type);
      if(loader){
        req.options.type = (loader.options.type || type);
        req.options.ext = ( req.options.ext || loader.options.ext );
      }
    }

    req.fromAlias = (req.fromAlias)?
      req.fromAlias.replace(match, ''):
      req.from.replace(match, '');
  });
  
  if(extTest.test(req.from)){
    req.from.replace(extTest, function(match, ext, index, value){
      req.options.ext = ext;
      req.fromAlias = req.fromAlias.replace(match, '');
    });
  }

  return req;

});

/**
 * Search for a matching pattern and replace.
 *
 * @example
 * z.setup({
 *   'foo.bar': 'root.foo.bar'
 * });
 */
z.filter('all', 'alias', function(req, filters){

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

  req.fromAlias = (req.fromAlias)? 
    req.fromAlias.replace(search, replace) :
    req.from.replace(search, replace);

  return req;

});

/**
 * Basic shim support.
 */
z.filter('all', 'shim', function(req, filters){

  if(!filters.hasOwnProperty(req.from)){
    return req;
  }

  var ext = (req.options.ext || 'js')

  if(u.isFunction(filters[req.from])){
    return filters[req.from](req);
  }

  req.src = z.config.root + filters[req.from].src + '.' + ext;
  return req;

});

/**
 * Get a src from a request.
 */
z.filter('all', 'src', function(req){

  if(req.src){
    return req;
  }

  if(!req.options.ext) {
    var loader = z.loader( (req.options.type || 'script') );
    req.options.ext = loader.options.ext;
  }

  var name = (req.fromAlias || req.from)
    , ext = req.options.ext
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
z.filter('ajax', 'method', function(req){
  if(req.method){
    return req;
  }
  if(req.options.method){
    req.method = req.options.method;
    delete req.options.method;
    return req;
  }
  var loader = z.loader( (req.options.type || 'ajax') );
  req.method = loader.options.method.toLowerCase();
  return req;
});