  /**
   * ----------------------------------------------------------------------
   * z.Ajax
   *
   * Fit's ajax wrapper
   */

  var AJAX_STATUS = {
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4
  };

  var HTTP_METHODS = [
    'GET',
    'PUT',
    'POST',
    'DELETE'
  ];

  var AJAX_DEFAULTS = {
    url: '',
    method: 'GET',
    data: false
  }

  /**
   * Ajax API
   */
  z.Ajax = {

    /**
     * Send an XMLHttpRequest
     *   
     *  z.Ajax.request({url:'my/api/01', method:'get'}, function(req, res){
     *    // req == the request you sent, res == the response.
     *  }, function(req, status){
     *    // If there was an error, this callback will be called.
     *  });
     *
     * @param {Object} callbacks Callbacks to run on script load.
     * @return {XMLHttpRequest}
     */ 
    request: function(req, next, err){
      var request
        , self = this
        , method = 'GET';

      req = z.util.defaults(AJAX_DEFAULTS, req);
      
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

      var promise = new z.Promise(function(res, rej){

        request.onreadystatechange = function(){
          if(self.isDone(this.readyState)){
            if(200 === this.status){
              if(this.response){
                res(this.response);
              } else {
                res(this.responseText);
              }
            } else {
              rej(this.status);
            }
          }
        }

      });

      if(z.util.isFunction(next)){
        promise.then(next);
      }
      if(z.util.isFunction(err)){
        promise.catches(err);
      } else {
        promise.catches(function(e){
          throw e;
        });
      }

      if(method === "GET" && req.data){
        req.url += '?' + this._buildQueryStr(req.data);
      }

      request.open(method, req.url, true);

      if(method === "POST" && req.data){
        var params = this._buildQueryStr(req.data)
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.send(params);
      } else {
        request.send();
      }

      return promise;
    },

    _buildQueryStr: function(data){
      var query = []
        ;
      for(var key in data){
        query.push(key + '=' + data[key]);
      }
      return query.join('&');
    },

    isDone: function(state){
      return state === AJAX_STATUS.DONE;
    }

  }