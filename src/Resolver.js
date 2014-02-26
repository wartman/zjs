/**
 * ----------------------------------------------------------------------
 * z.Resolver
 *
 * The resolver is basically a very stripped down promise. Having a full-on
 * promise implementation is a bit overkill for the module loader, so this
 * is the smallest implementation we can get away with.
 *
 * Resolvers can, however, be bound to Promise/A+ implementations in the
 * following ways:
 *   var resolver = new z.Resolver;
 *   var promise = new Promise(resolver.ready); // Binds the resolver to the promise.
 *   // or
 *   promise.then(resolver); // Binds the promise to the resolver.
 *   resolver.resolve(onFulfilled, onRejected); // Will resolve the promise.
 */

var RESOLVER_STATE = {
  PENDING: 0,
  READY: 1,
  REJECTED: -1
};

var Resolver = z.Resolver = z.Class({

  /**
   * Initilize the resolver.
   *
   * @param {Object} options (optional)
   */
  __new__: function(){
    this._onReady = [];
    this._onRejected = [];
    this._value = null;
    this._state = RESOLVER_STATE.PENDING;

    if(this.__init__)
      this.__init__.apply(this, arguments);
  },

  /**
   * Add a ready callback. 
   *
   * @param {Function} onReady
   * @param {Function} onRejected
   * @return {Resolver}
   */
  done: function(onReady, onRejected){
    if(onReady){
      (this.isReady())?
        onReady(this._value) :
        this._onReady.push(onReady);
    }
    if(onRejected){
      (this.isRejected())?
        onRejected(this._value) :
        this._onRejected.push(onRejected);
    }
    return this;
  },

  /**
   * Add a failure callback. 
   *
   * @param {Function} onRejected
   * @return {Resolver}
   */
  failed: function(onRejected){
    return this.ready(undefined, onRejected);
  },

  /**
   * An alias for Resolver#ready.
   * This method is here only to ensure that it can be complient
   * with /A+ promises -- please do not try to use the resolver 
   * as a promise.
   *
   * @param {Function} onReady
   * @param {Function} onRejected
   * @return {Resolver}
   */
  then: function(onReady, onRejected){
    return this.ready(onReady, onFailed);
  },

  /**
   * Resolve the resolver with the provided value.
   *
   * @param {Mixed} value
   */
  resolve: function(value){
    this._value = value;
    this._state = RESOLVER_STATE.READY;
    this._dispatch(this._onReady);
  },
  
  /**
   * Reject the resolver with the provided value.
   *
   * @param {Mixed} reason
   */
  reject: function(reason){
    this._value = reason;
    this._state = RESOLVER_STATE.REJECTED;
    this._dispatch(this._onRejected);
  },

  /**
   * A helper function to run callbacks.
   *
   * @param {Array} fns
   */
  _dispatch: function(fns){
    var value = this._value
      , self = this;
    // Execute fns from first added to last.
    while(fns.length){
      var fn = fns.shift();
      fn.call(self, value);
    }
  }

});

/** 
 * Add state helpers to the Resolver prototype.
 */
z.u(['Ready', 'Rejected', 'Pending']).each(function(state){
  var STATE = state.toUpperCase();
  Resolver.prototype['is'+state] = function(){
    return this._state === RESOLVER_STATE[STATE];
  }
});