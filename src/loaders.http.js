/**
 * ----------------------------------------------------------------------
 * Default loaders
 */

/**
 * Script loader
 */
z.loader('script', {
  method: z.Script,
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
  handler: function(req, res, next, error){
    z(req.from, function(){ return res; }).done(next, error);
  },
  options: {
    ext: 'js',
    method: 'GET'
  }
});