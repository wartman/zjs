/**
 * ----------------------------------------------------------------------
 * z.Filters
 *
 * Request filtering
 */

var Filters = {

  _scopes: {
    all: {}
  },

  /**
   * Add a filter to the given scope.
   *
   * @param {String} scope
   * @param {String} name An identifier. Just used for debugging.
   * @param {Function} cb
   */
  add: function(scope, name, cb){
    if(!this._scopes.hasOwnProperty(scope)){
      this._scopes[scope] = {};
    }

    // Wrap the filter
    var filter = function(req){
      var filters = (z.config[name] || {});
      return cb(req, filters, u);
    }

    this._scopes[scope][name] = filter;
  },

  /**
   * Run all filters in given scope.
   *
   * @throws {Error}
   * @throws {TypeError}
   * @param {String} scope
   * @param {Object} req The request to be filtered.
   * @return {Object | False} Returns the modified request or false if failed.
   **/
  dispatch: function(scope, req){
    if(!this._scopes.hasOwnProperty(scope)){
      throw new Error('No filters in the requested scope: ' + scope);
      return false;
    }
    if(!req || !u.isObject(req)){
      throw new TypeError('Request must be an object: ' + typeof req);
      return false;
    }

    var fns = this._scopes[scope];

    u.each(fns, function(fn, name){
      try {
        req = fn(req);
      } catch(e) {
        throw new Error('Filter `' + name + '` failed with error: ' + e.message);
      }
    });

    return req;
  }

}

/**
 * filter API
 */
z.filter = function(scope, name, cb){
  if(arguments.length <= 1){
    if(Filters._scopes.hasOwnProperty(scope)){
      return Filters._scopes[scope];
    }
  }
  Filters.add(scope, name, cb);
  return Filters._scopes[scope];
}

z.runFilters = function(scope, req){
  return Filters.dispatch(scope, req);
}