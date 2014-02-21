/**
 * ----------------------------------------------------------------------
 * Loader
 *
 * A class that contains some common functionality for z's script loader
 * and its ajax loader.
 */

LOADER_STATE = {
  PENDING: 0,
  DONE: 1,
  FAILED: -1
};

var Loader = z.Class({
  
  __new__: function(req, options){
    this.options = u.defaults(this.options, options);

    this.node = false;

    this._state = LOADER_STATE.PENDING;

    this._onReady = [];
    this._onFailed = [];

    this._value = false;

    this.__init__.apply(this, arguments);

    this.load(req);
  },

  __init__: function(){
    // no-op
  },

  load: function(req){
    // no-op
  },

  /**
   * Callbacks to run on ready.
   *
   * @param {Function} onReady
   * @param {Function} onFailed
   */
  ready: function(onReady, onFailed){
    if(onReady && u.isFunction(onReady)){
      (this.isDone())?
        onReady(this._value) :
        this._onReady.push(onReady);
    }
    if(onFailed && u.isFunction(onFailed)){
      (this.isFailed())?
        onFailed(this._value):
        this._onFailed.push(onFailed);
    }
  },

  /**
   * Resolve the loader based on the passed state.
   *
   * @param {Mixed} arg
   * @param {Integer} state
   */
  _resolve: function(arg, state){
    if(state){
      this._state = state;
    }

    var self = this;

    if(this.isDone()){
      u.each(self._onReady, function(fn){
        fn(arg);
      });
      this._onReady = [];
      return;
    }

    if(this.isFailed()){
      u.each(self._onFailed, function(fn){
        fn(arg);
      });
      this._onFailed = [];
      return;
    }
  }

});

u.each(['Done', 'Pending', 'Failed'], function(state){
  Loader.prototype['is' + state] = function(){
    return this._state === LOADER_STATE[state.toUpperCase()];
  } 
});