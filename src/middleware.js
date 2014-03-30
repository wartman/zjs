/**
 * ----------------------------------------------------------------------
 * z.Middleware
 *
 * rack-style middleware. The plan is for this to override filters and plugins
 * with a single, unified system.
 */

var Middleware = {

  _stack: [
    /**
     * Runs on final item.
     */
    function(req, res){
      return res;
    }
  ],

  _onError = function(reason){
    throw new Error(reason);
  },

  add: function(middleware){
    var self = this;

    var cb = function(req, res){
      var next = self._stack[0];
      var error = self._onError;
      return middleware(req, res, next, error);
    }

    this._stack.unshift(cb);
  }

  run: function(req, done, error){

    // Call 'res.done' when at the end of the middleware stack.
    var res = {
      done: function(response){
        return done(response);
      }
    };

    this._onError = error;

    this._stack[0](req, res, error);
  }

}

/**
 * Middleware, response and request API
 */
z.add = function(middleware){
  Middleware.add(middleware);
}

z.request = function(req, done, error){
  Middleware.run(req, {}, done, error);
}

var _response = null;
z.response = function(next){
  if( set ){
    _response = set;
  }
  return _response;
}