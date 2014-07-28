// Helpers
// -------

// Get all the keys in an object.
function keys (obj) {
  if ("object" !== typeof obj) return [];
  if (Object.keys) return Object.keys(obj);
  var keys = [];
  for (var key in obj) if (_.has(obj, key)) keys.push(key);
  return keys;
};

// Get the size of an object
function size (obj) {
  if (obj == null) return 0;
  return (obj.length === +obj.length) ? obj.length : keys(obj).length;
};

// Iterate over arrays or objects.
function each (obj, callback, context) {
  if(!obj){
    return obj;
  }
  context = (context || obj);
  if(Array.prototype.forEach && obj.forEach){
    obj.forEach(callback)
  } else if (obj instanceof Array) {
    for (var i = 0; i < obj.length; i += 1) {
      if (obj[i] && callback.call(context, obj[i], i, obj)) {
        break;
      }
    }
  } else {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (key && callback.call(context, obj[key], key, obj)) {
          break;
        }
      }
    }
  }
  return obj;
}

function defaults (obj, source) {
  if (source) {
    for (var prop in source) {
      if (obj[prop] === void 0) obj[prop] = source[prop];
    }
  }
  return obj;
};

// Run through each item in an array, then resolve a Wait
// once all items have been iterated through.
//
//    eachWait(object, function(item, next) {
//      // do something with 'item', then do the next thing
//      next(null, 'Foo');
//    })
//    .done(function (err, someValue) {
//      console.log("Last item ran!")
//    });
//
function eachWait (obj, callback, context) {
  var len = size(obj);
  var current = 0;
  var wait = new Wait();
  context = context || obj;
  var next = function (err) {
    if (err) {
      wait.reject(err);
      return;
    }
    current += 1;
    // We're at the last item, so resolve the wait.
    if (current === len) wait.resolve();
  };
  // Run an 'each' loop
  each(obj, function (item) {
    callback.call(context, item, next);
  });
  return wait;
}

// Ensure the string ends with a backslash
function slashify (str) {
  return (str.lastIndexOf('/') !== (str.length - 1))? str + '/' : str;
}