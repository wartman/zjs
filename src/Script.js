/**
 * ----------------------------------------------------------------------
 * z.Script
 *
 * z's script loader. Extends z.Resolver.
 */

var Script = z.Script = Resolver.extend({

  options: {
    nodeType: 'text/javascript',
    charset: 'utf-8',
    async: true
  },

  __init__: function(req, options){
    this.options = u.defaults(this.options, options);
    this.node = false;
    this.load(req);
  },

  /**
   * Create a script node.
   *
   * @return {Element}
   */
  create: function(){
    var node = document.createElement('script');
    node.type = this.options.nodeType || 'text/javascript';
    node.charset = this.options.charset;
    node.async = this.options.async;
    return node;
  },

  /**
   * Load a request
   *
   * @param {Object | String} req
   */
  load: function(req){

    var node = this.create()
      , head = document.getElementsByTagName('head')[0]
      , self = this
      , settings = this.scriptSettings
      , defaults = {
          src: ''
        };

    // Allow the user to just pass an src.
    if(z.u.isString(req)){
      req = {
        src: req
      };
    }

    req = u.defaults(defaults, req);

    node.setAttribute('data-from', (req.from || req.src));

    _scriptLoadEvent(node, function(node){
      self.resolve(node);
    }, function(e){
      self.reject(e);
    });

    // For ie8, code may start running as soon as the node
    // is placed in the DOM, so we need to be ready:  
    Script.currentlyAddingScript = node;
    node.src = req.src;
    head.appendChild(node);
    // Clear out the current script after DOM insertion.
    Script.currentlyAddingScript = null;
  }

});

/**
 * The following methods and properties are for older browsers, which
 * may start defining a script before it is fully loaded.
 */
Script.useInteractive = false;
Script.currentlyAddingScript = null;
Script.interactiveScript = null;
Script.getInteractiveScript = function(){
  if (Script.interactiveScript && Script.interactiveScript.readyState === 'interactive') {
    return Script.interactiveScript;
  }

  u.eachReverse(Script.scripts(), function (script) {
    if (script.readyState === 'interactive') {
      Script.interactiveScript = script;
      return true;
    }
  });
  return Script.interactiveScript;
}

Script.scripts = function(){
  return document.getElementsByTagName('script');
} 

/**
 * Configure the event listener.
 */
var _scriptLoadEvent = (function(){

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
      Script.useInteractive = true;
      node.attachEvent('onreadystatechange', function(){
        // if(node.readyState === 'loaded'){  // I could swear this was correct.
        if(node.readyState === 'complete'){
          next(node);
          Script.interactiveScript = null;
        }
      });
      // Error handler not possible I beleive.
    }

  } else {
    
    loader = function(node, next, err){
      node.addEventListener('load', function(e){
        next(node);
      }, false);
      node.addEventListener('error', function(e){
        err(e);
      }, false);
    }

  }

  return loader;

})();

/**
 * ----------------------------------------------------------------------
 * Script API
 *
 * @param {Object} req
 * @param {Function} next
 * @param {Function} err
 * @return {Script}
 */
z.script = function(req, next, error){
  var s = new Script(req, z.config.script);
  s.done(next, error);
  return s;
}