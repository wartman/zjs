  /**
   * ----------------------------------------------------------------------
   * z.Scripts
   *
   * Fit's Script loader, which uses the DOM to get js files.
   */

  // TODO:
  // Add STATUS inline with other modules.
  // Try to add promises, which seem to break things for some reason.

  SCRIPTS_STATUS = {
    PENDING: 0,
    DONE: 1,
    FAILED: -1
  };

  /**
   * Scripts API
   */
  var Scripts = z.Scripts = {

    scriptSettings: {
      nodeType: 'text/javascript',
      charset: 'utf-8',
      async: true
    },

    currentlyAddingScript: null,
    interactiveScript: null,
    lastReq: null,

    pending: [],

    /**
     * Check if a file has been loaded from the passed url.
     *
     * @param {String} url
     * @return {Boolean}
     */
    isLoaded: function(url){
      var scripts = this.scripts()
        , wasLoaded = false
        ;

      z.util.each(scripts, function(item){
        if(item.getAttribute('data-from') === url){
          wasLoaded = true;
          return true;
        }
      });

      return wasLoaded;
    },

    /**
     * Check if a file with the requested url is loading.
     *
     * @param {String} url
     * @return {Boolean}
     */
    isPending: function(url){
      return this.pending.indexOf(url) >= 0;
    },

    /**
     * Create a script node.
     *
     * @param {Object} req
     * @param {Function} next
     * @param {Function} err
     * @returns {script}
     */
    load: function(req, next, err){

      var node = document.createElement('script')
        , head = document.getElementsByTagName('head')[0]
        , self = this
        , settings = this.scriptSettings
        , defaults = {
            url: ''
          }
        , events
        ;
        
      req = z.util.defaults(defaults, req);

      node.type = settings.nodeType || 'text/javascript';
      node.charset = settings.charset;
      node.async = settings.async;

      node.setAttribute('data-from', (req.from || req.url));

      this.pending.push(req.url);

      if(typeof next !== 'function'){
        next = function(){};
      }
      if(typeof err !== 'function'){
        err = function(req, e){
          throw new Error("Failed loading "+req.url);
        }
      }

      scriptLoadEvent(node, next, err);

      // For ie8, code may start running as soon as the node
      // is placed in the DOM, so we need to be ready:  
      this.currentlyAddingScript = node;
      head.appendChild(node);
      node.src = req.url;
      // Clear out the current script after DOM insertion.
      this.currentlyAddingScript = null;


      return node;

    },

    /**
     * Get all the scripts on the page.
     */
    scripts: function() {
      return document.getElementsByTagName('script');
    },

    // SPEND MORE TIME ON THIS
    // Not entirely sure when or why this is being used yet.
    // Targets ie9 <, but also seems to be called by IE10.
    getInteractiveScript: function(){
      if (this.interactiveScript && this.interactiveScript.readyState === 'interactive') {
        return interactiveScript;
      }

      z.util.eachReverse(this.scripts(), function (script) {
        if (script.readyState === 'interactive') {
          return (self.interactiveScript = script);
        }
      });
      return interactiveScript;
    }

  }

  /**
   * Configure the event listener.
   */
  var scriptLoadEvent = (function(){

    if(typeof document === "undefined"){
      // Return an empty function if this is a server context
      return function(node, next, err){ /* noop */ };
    }

    var testNode = document.createElement('script')
      , loader = null;

    // Test for support.
    // Test for attach event as IE9 has a subtle error where it does not 
    // fire its onload event right after script-load with addEventListener,
    // like most other browsers.
    // (based on requireJs)
    if (testNode.attachEvent){

      // Because onload is not fired right away, we can't add a define call to
      // anonymous modules. However, IE reports the script as being in 'interactive'
      // ready state at the time of the define call.
      loader = function(node, next, err){
        z.Scripts.useInteractive = true;
        node.attachEvent('onreadystatechange', function(){
          if(node.readyState === 'loaded'){
            next(node);
            z.Scripts.interactiveScript = null;
          }
        });
        // Error handler not possible I beleive.
      }

    } else {
      
      loader = function(node, next, err){
        node.addEventListener('load', function(e){
          next(node);
          z.Scripts.interactiveScript = null;
        }, false);
        node.addEventListener('error', function(e){
          err(e);
          z.Scripts.interactiveScript = null;
        }, false);
      }

    }

    return loader;

  })();