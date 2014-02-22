/**
 * The default plugin, used for loading js files.
 */
z.plugin('script', Script, function(req, res, next, error){
  var name = req.from;
  z.ensureModule(name);
  next();
}, {
  ext: 'js'
});

/**
 * Load other files.
 */
z.plugin('ajax', Ajax, function(req, res, next, error){
  var name = req.from;
  z(name, function(){ return res; }).done(next, error);
}, {
  req: {
    method: 'GET',
  },
  ext: 'txt'
});