/**
 * ----------------------------------------------------------------------
 * z.Ajax
 *
 * Fit's ajax wrapper
 */

var AJAX_STATE = {
  PENDING: 0,
  OPENED: 1,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  DONE: 4,
  FAILED: -1
};

var HTTP_METHODS = [
  'GET',
  'PUT',
  'POST',
  'DELETE'
];

var Ajax = z.Ajax = Resolver.extend({

  options: {
    defaults: {
      src: '',
      method: 'GET',
      data: false
    }
  },

  __init__: function(req, options){
    this.options = z.u.defaults(this.options, options);
    this.load(req);
  },

  load: function(req){

    var request
      , self = this
      , method = 'GET';

    req = u.defaults(this.options.defaults, req);
    
    method = req.method.toUpperCase() === 'GET';

    if(HTTP_METHODS.indexOf(method) <= 0){
      // Ensure we have an allowed method.
      method = 'GET';
    }

    if(window.XMLHttpRequest){
      request = new XMLHttpRequest();
    } else { // code for IE6, IE5
      request = new ActiveXObject("Microsoft.XMLHTTP");
    }

    request.onreadystatechange = function(){
      if(AJAX_STATE.DONE === this.readyState){
        if(200 === this.status){
          self.resolve(this.responseText);
        } else {
          self.reject(this.status);
        }
      }
    }

    if(method === "GET" && req.data){
      req.src += '?' + this._buildQueryStr(req.data);
    }

    request.open(method, req.src, true);

    if(method === "POST" && req.data){
      var params = this._buildQueryStr(req.data)
      request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      request.send(params);
    } else {
      request.send();
    }
  },

  _buildQueryStr: function(data){
    var query = []
      ;
    for(var key in data){
      query.push(key + '=' + data[key]);
    }
    return query.join('&');
  }

});

u.each(['Done', 'Pending', 'Failed'], function(state){
  Ajax.prototype['is' + state] = function(){
    return this._state === AJAX_STATE[state.toUpperCase()];
  } 
});

/**
 * ----------------------------------------------------------------------
 * Ajax API
 *
 * @param {Object} req
 * @param {Function} next
 * @param {Function} err
 * @retrun {Ajax}
 */
z.ajax = function(req, next, err){
  var a = new Ajax(req, z.config.ajax);
  a.done(next, err);
  return a;
}