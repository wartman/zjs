(function () {
/* namespaces */
var app = this.app = {};
var fixtures = this.fixtures = {};
fixtures.stress = {};
fixtures.stress.item = {};
var foo = this.foo = {};
fixtures.file = {};

/* modules */
/*!
 * This is an example of a license header.
 *
 * Copyright would go here.
 * Released under the MIT license
 */

(function(global){
  global.shim = "shimmed";
})(this);
fixtures.file.txt = (function () {
var exports = (function anonymous() {
  return 'loaded'
})();
return exports;
})();
foo.mapped = (function () {
var exports = (function () {
  return "mapped";
})();
return exports;
})();
fixtures.stress.three = (function () {
var exports = (function (){
    return {
      Three: "three"
    };
  })();
return exports;
})();
fixtures.stress.two = (function () {
var exports = (function (){
    return {
      Two: "two"
    };
  })();
return exports;
})();
fixtures.stress.item.foo = (function () {
var exports = (function (){
  return "Foo";
})();
return exports;
})();
fixtures.stress.one = (function () {
var exports = (function (){
    return {
      One: "one",
      Foo: fixtures.stress.item.foo
    };
  })();
return exports;
})();
app.main = (function () {
var exports = (function (){
    return "the main file";
  })();
return exports;
})();

}).call(this);