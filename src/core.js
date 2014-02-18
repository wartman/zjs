  /**
   * ----------------------------------------------------------------------
   * z.core
   * 
   * Definitions, bootstraping, etc for z.
   */

  /**
   * Fit's root-level namespace.
   *
   * @var {Object}
   */
  var z = root.z = {};

  /**
   * Save a few bytes in minified form
   */
  var ArrayProto = Array.prototype
    , ObjProto = Object.prototype
    , FuncProto = Function.prototype;

  /**
   * Shortcuts to often used core prototypes.
   */
  var push             = ArrayProto.push
    , slice            = ArrayProto.slice
    , concat           = ArrayProto.concat
    , toString         = ObjProto.toString
    , hasOwnProperty   = ObjProto.hasOwnProperty;

  /**
   * Default configuration for z.
   *
   * @var {Object}
   */
  z.config = {
    module: {
      root: '',
      shim: {},
      alias: {}
    },
    env: 'browser'
  };

  /**
   * Setup z.
   *
   * @param {Object} options
   * @return {Undefined}
   */
  z.setup = function(options){
    for(var key in options){
      if(options.hasOwnProperty(key)){
        z.config[key] = z.util.defaults(z.config[key], options[key]);   
      }
    }
    z.module.setup(z.config.module);
  }

  /**
   * Run when the DOM is ready (similar to jQuery.isReady)
   * Based on (with some changes):
   *
   *  contentloaded.js
   *
   *  Author: Diego Perini (diego.perini at gmail.com)
   *  Summary: cross-browser wrapper for DOMContentLoaded
   *  Updated: 20101020
   *  License: MIT
   *  Version: 1.2
   *
   *  URL:
   *  http://javascript.nwbox.com/ContentLoaded/
   *  http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
   *
   *
   * @parm {Function} next
   * @return {Undefined}
   */

  z.boot = function(next){
    // to do: needs to know if it's in Node.js context

    var done = false
      , top = true
      , doc = root.document
      , el = doc.documentElement
      , add = doc.addEventListener ? 'addEventListener' : 'attachEvent'
      , rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent'
      , pre = doc.addEventListener ? '' : 'on'
      ;

    init = function(e){
      if(e.type == 'readystatechange' && doc.readyState != 'complete'){
        return;
      }
      (e.type == 'load' ? root : doc)[rem](pre + e.type, init, false);
      if(!done && (done = true)){
        next.call(root, e.type || e);
      }
    }

    // A hack for really out of date browsers (ie)
    poll = function(){
      try{ el.doScroll('left') } catch(e){ setTimeout(poll, 50); return; }
      init('poll');
    }

    if(doc.readyState == 'complete'){
      next.call(root, 'lazy');
    } else {
      if( doc.createEventObject && el.doScroll ){
        try{ top = !win.frameElement; } catch(e) { }
        if(top){ poll(); }
      }
      doc[add](pre + 'DOMContentLoaded', init, false);
      doc[add](pre + 'readystatechange', init, false);
      root[add](pre + 'load', init, false);
    }

  }