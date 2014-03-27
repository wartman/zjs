/**
 * ----------------------------------------------------------------------
 * z.Filters
 *
 * Request filtering
 */

/**
 * filter API
 */
_filters = {};
z.filter = function(name, cb, global){
  if(arguments.length <= 1){
    if(_filters.hasOwnProperty(name)){
      return _filters[name];
    }
    return false;
  }

  _filters[name] = function(req, ctx){
    var filters = (z.config[name] || z.config);
    return cb.apply(ctx, [req, filters, u]);
  }

  // gloablize??

  return _filters[name];
}