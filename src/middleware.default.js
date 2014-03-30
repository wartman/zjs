/**
 * ----------------------------------------------------------------------
 * Default z.Middleware
 *
 * Basic middleware handling.
 */

/**
 * Load an item
 */
z.add(function(req, res, next, error){

  if(req.options.type === 'script'){
    // Stop propegation.
    return z.script(req).done(function(node){
      z.ensureModule(req.from);
      res.done(node); // Run results callback.
    });
  }

  if(req.options.type === 'ajax'){
    return z.ajax(req).done(function(data){
      z(req.from, function(){ return data; }).done(function(){
        res.done(data); // Run results callback.
      });
    });
  }

  // Otherwise, keep going.
  return next(req, res);

}


/**
 * Filter for plugin type.
 */
var pluginTest = /([\S^\!]+?)\!/g
  , extTest = /\.([txt|json]+?)$/g
  , pluginMatch = {
      ajax: ['ajax', 'json', 'txt']
    }
z.add(function(req, res, next, error){

  if(!pluginTest.test(req.from)){
    return next(req, res);
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

  return next(req, res);

});

/**
 * Search for a matching pattern and replace.
 *
 * @example
 * z.setup({
 *    alias: {
 *      'foo.bar': 'root.foo.bar'
 *    }
 * });
 */
z.add(function(req, res, next, error){

  var nsTest = new RegExp('[' + req.from.replace(/\./g, '\\.') + ']+?')
    , search = false
    , replace = ''
    , filters = z.config['alias'];

  for (var key in filters){
    if(nsTest.test(key)){
      search = key;
      replace = filters[key];
    }
  }

  if(!search){
    return next(req, res);
  }

  req.fromAlias = (req.fromAlias)? 
    req.fromAlias.replace(search, replace) :
    req.from.replace(search, replace);

  return next(req, res);

});

/**
 * Basic shim support.
 */
z.add(function(req, res, next, error){

  var filters = z.config.shim;

  if(!filters.hasOwnProperty(req.from)){
    return next(req, res);
  }

  var ext = (req.options.ext || 'js')

  if(u.isFunction(filters[req.from])){
    return filters[req.from](req);
  }

  req.src = z.config.root + filters[req.from].src + '.' + ext;
  
  return next(req, res);
});

/**
 * Get a src from a request.
 */
z.add(function(req, res, next, error){

  if(req.src){
    return next(req, res);
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
  return next(req, res);

});

/**
 * Method filter
 */
z.add(function(req, res, next, error){
  if(req.method){
    return next(req, res);
  }
  if(req.options.method){
    req.method = req.options.method;
    delete req.options.method;
    return next(req, res);
  }
  var loader = z.loader( (req.options.type || 'ajax') );
  req.method = loader.options.method.toLowerCase();
  return next(req, res);
});