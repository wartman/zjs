/**
 * ----------------------------------------------------------------------
 * z.util
 *
 * A few utility funcs.
 */

var forEach = Array.prototype.forEach
  , slice = Array.prototype.slice
  , toString = Object.prototype.toString
  , objKeys = Object.keys
  , undef;

var u = {};

u.each = function(obj, callback, context) {
  if(!obj){
    return obj;
  }
  context = (context || obj);
  if(forEach && obj.forEach){
    obj.forEach(callback)
  } else if ( u.isArray(obj) ){
    for (var i = 0; i < obj.length; i += 1) {
      if (obj[i] && callback.call(context, obj[i], i, obj)) {
        break;
      }
    }
  } else {
    for(var key in obj){
      if(obj.hasOwnProperty(key)){
        if(key && callback.call(context, obj[key], key, obj)){
          break
        }
      }
    }
  }
  return obj;
}

u.eachReverse = function(obj, callback, context) {
  if (obj) {
    var i;
    for (i = obj.length - 1; i > -1; i -= 1) {
      if (obj[i] && callback.call(context, obj[i], i, obj)) {
        break;
      }
    }
  }
  return obj;
}

u.extend = function(obj){
  u.each(slice.call(arguments, 1), function(source){
    if(source){
      for(var prop in source){
        obj[prop] = source[prop]
      }
    }
  });
  return obj;
}

u.isObject = function(obj){
  return obj === Object(obj);
}

u.defaults = function(obj, options){
  if(undefined === options){
    return obj;
  }
  for(var key in obj){
    if(obj.hasOwnProperty(key) && ! options.hasOwnProperty(key)){
      options[key] = obj[key];
    }
  }
  return options;
}

u.keys = function(obj){
  if(!u.isObject(obj)) return [];
  if(objKeys) return objKeys(obj);
  var keys = [];
  for(var key in obj){
    keys.push(key);
  }
  return keys;
}

u.isEmpty = function(obj){
  if (obj == null){
    return true;
  } 
  if (obj instanceof Array || obj instanceof String){
    return obj.length === 0;
  }
  for (var key in obj){ // Does not handle enum bugs in ie <9
    if(obj.hasOwnProperty(key)){
      return false;
    }
  }
  return true;
}

u.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
  u['is' + name] = function(obj) {
    return toString.call(obj) == '[object ' + name + ']';
  };
});

u.isArray = (Array.isArray || function(obj){
  return toString.call(obj) == '[object Array]';
});