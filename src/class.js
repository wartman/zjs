  /**
   * ----------------------------------------------------------------------
   * z.Class
   *
   * Based on John Resig's inheritance technique,
   * (see http://ejohn.org/blog/simple-javascript-inheritance/)
   * that was inspired by base2 and Prototype.
   * 
   * Modified a bit -- uses a diferent method (based on coffescript)
   * to avoid calling the constructor, with the intention to allow
   * the direct definition of the constructor.
   *
   * MIT Licensed.
   */
  var fnTest = /xyz/.test(function(){xyz;}) ? /\b__super__\b/ : /[\D|\d]*/;

  /**
   * The function used to actually extend classes.
   *   var Foo = z.Class({ ... });
   *   var Bar = Foo.extend({ ... });
   *
   * @param {Object} props
   * @return {Object}
   * @api private
   */
  var classExtend = function(props) {
    // The parent.
    var __super__ = this.prototype
      , parent = this
      // props["__new__"] will overwrite the constructor of the new class.
      , Class = (z.util.isFunction(props["__new__"]))? 
        (function(){
          var ret = props["__new__"];
          delete props["__new__"];
          return ret;
        })() :
        // Inherit the parent constructor.
        function(){
          parent.apply(this, arguments);
        }

    // Set up the prototype chain from the parent.
    // Use a surrogate so that we don't call the constructor.
    // (per backbone)
    var Surrogate = function(){ this.constructor = Class; }
    Surrogate.prototype = this.prototype;
    Class.prototype = new Surrogate;

    // Copy the properties over onto the new prototype
    for (var name in props) {
      // Check if we're overwriting an existing function in the parent and make sure
      // the method actually uses "__super__", otherwise don't bother creating a closure
      // with the "__super__" call.
      Class.prototype[name] = ( z.util.isFunction(props[name]) 
      && z.util.isFunction(__super__[name]) 
      && fnTest.test(props[name]) ) ?
        (function(name, fn){
          return function() {
            var tmp = this.__super__;
            this.__super__ = __super__[name];
            var ret = fn.apply(this, arguments);
            this.__super__ = tmp;

            return ret;
          };
        })(name, props[name]) :
        props[name];
    }

    // Make sure constructor is the one you expect.
    Class.prototype.constructor = Class;

    // Make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };

  /**
   * The default class constructor.
   */
  var classConstructor = function(){
    if(this.__init__){
      this.__init__.apply(this, arguments);
    }
  }
 
  /**
   * The Class API.
   * Creates a new class, or acts as an alternate way to extend a class.
   *   var Foo = z.Class({ ... });
   *   var Bar = z.Class(Bar, {...});
   * You can also use this function to extend generic objects or functions.
   *   var Foo = z.Class({...}, {...})
   *
   * @param {Object} parent (optional)
   * @param {Object} props
   * @return {Object}
   */
  z.Class = function(parent, props){
    if( z.util.isUndefined(props) ){
      props = parent;
      parent = false;
    }

    // The most common case, so try it first.
    if(!parent){
      return classExtend.call(classConstructor, props);
    }

    if(parent && hasOwnProperty.call(parent, 'extend')){
      return parent.extend(props);
    } else if (z.util.isFunction(parent)){
      // Use parent as constructor.
      return classExtend.call(parent, props);
    } else if(z.util.isObject(parent)){
      // Bind the default constructor to the object.
      parent.__new__ = classConstructor;
      return classExtend.call(parent, props);
    } else {
      // I guess they tried to pass a string or something crazy.
      throw new TypeError('{parent} must be a function, object or undefined.');
    }
  }

  // Expose Class to the root.
  root.Class = z.Class;