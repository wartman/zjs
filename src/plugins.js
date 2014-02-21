/**
 * The default plugin, used for loading js files.
 */
z.plugin('script', function(req, next, error){
  var name = req.from
    , self = this;
  if(z.script.isPending(req.url)){
    return;
  }
  z.script(req, function(node){
    z.ensureModule(name);
    next();
  }, error);
});

/**
 * Load other files.
 */
z.plugin('ajax', function(req, next, error){
  var name = req.from
    , self = this
    , mod = z(name); // The module that will wrap the file.

  req.method = 'GET';
  z.ajax(req, function(data){
    mod.exports(function(){ return data; });
    next();
  }, error);
});