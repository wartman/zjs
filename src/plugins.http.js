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
    , parsed = []
    , src = '';

  u.each(nameParts, function(part, index){
    if(alias.hasOwnProperty(part)){
      if(alias[part] === "" || alias[part] === false){
        return;
      }
      parsed.push(alias[part]);
    } else {
      parsed.push(nameParts[index])
    }
  });

  name = parsed.join('.');

  if(shim.hasOwnProperty(name)){
    src = shim[name].src;
  } else {
    src = name.replace(/\./g, '/');
    src = z.config.root + src + '.' + ext;
    src = src.trim('/')
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