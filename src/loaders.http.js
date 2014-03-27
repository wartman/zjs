/**
 * ----------------------------------------------------------------------
 * Default loaders and filters
 */

/**
 * Script loader
 */
z.loader('script', {
  method: z.Script,
  filters: ['alias', 'shim', 'src'],
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
  filters: ['alias', 'shim', 'src', 'ajaxMethod'],
  handler: function(req, res, next, error){
    z(req.from, function(){ return res; }).done(next, error);
  },
  options: {
    ext: 'js',
    method: 'GET'
  }
});