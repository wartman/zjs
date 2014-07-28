// Wait
// ----
// This is a very stripped-down, promise-like class.

// Ensure async loading.
var nextTick = ( function () {
  var fns = [];
  var enqueueFn = function (fn, ctx) {
    if (ctx) bind(fn, ctx);
    return fns.push(fn);
  };
  var dispatchFns = function () {
    var toCall = fns
      , i = 0
      , len = fns.length;
    fns = [];
    while (i < len) { 
      toCall[i++]();
    }
  };
  if (typeof setImmediate == 'function') {
    return function (fn, ctx) { enqueueFn(fn, ctx) && setImmediate(dispatchFns) }
  }
  // legacy node.js
  else if (typeof process != 'undefined' && typeof process.nextTick == 'function') {
    return function (fn, ctx) { enqueueFn(fn, ctx) && process.nextTick(dispatchFns); };
  }
  // fallback for other environments / postMessage behaves badly on IE8
  else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {
    return function (fn, ctx) { enqueueFn(fn, ctx) && setTimeout(dispatchFns); };
  } else {
    var msg = "tic!" + new Date
    var onMessage = function(e){
      if(e.data === msg){
        e.stopPropagation && e.stopPropagation();
        dispatchFns();
      }
    };
    root.addEventListener('message', onMessage, true);
    return function (fn, ctx) { enqueueFn(fn, ctx) && root.postMessage(msg, '*'); };
  }
})();

// A super stripped down promise-like thing.
function Wait () {
  this._state = 0;
  this._onReady = [];
  this._value = null;
};

// Run a callback when done waiting. Callbacks follow
// the NodeJS convention of passing an error as the first
// argument and `value` as the second.
//
//    wait.done(function (err, value) { /*code*/ });
//
Wait.prototype.done = function(onReady){
  var self = this;
  nextTick(function(){
    if(onReady && ( "function" === typeof onReady)){
      if (self._state === 1)
        onReady.call(self, null, self._value);
      else if (self._state === -1)
        onReady.call(self, self._value);
      else
        self._onReady.push(onReady);
    }
  });
  return this;
};

// Resolve the Wait.
Wait.prototype.resolve = function(value, ctx){
  this._state = 1;
  this._dispatch(this._onReady, null, value, ctx);
  this._onReady = [];
};

// Reject the Wait.
Wait.prototype.reject = function(value, ctx){
  this._state = -1;
  value = value || new Error('Error in Wait');
  this._dispatch(this._onReady, value, null, ctx);
  this._onFailed = [];
};

// Helper to run callbacks
Wait.prototype._dispatch = function (fns, err, value, ctx) {
  this._value = (err || value);
  ctx = (ctx || this);
  var self = this;
  each(fns, function(fn){ fn.call(ctx, err, self._value); });
};
