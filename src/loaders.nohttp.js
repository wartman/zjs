/**
 * ----------------------------------------------------------------------
 * Loaders and filters for a single file.
 */

var UseModule = z.UseModule = z.Resolver.extend({
  load: function(req){
    console.log('loading');
    if(z.has(req.from)){
      this.resolve(req);
    } else {
      var self = this;
      setTimeout(function(){
        self.resolve(req);
      }, 0)
    }
  },
})

/**
 * Script loader
 */
z.loader('script', {
  method: z.UseModule,
  handler: function(req, res, next, error){
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
  method: z.UseModule,
  filters: ['ajax'],
  handler: function(req, res, next, error){
    next();
  },
  options: {
    ext: 'js',
    method: 'GET'
  }
});