(function(global){
/* namespaces */
var main = global.main = {};
var foo = global.foo = {};
global.foo.bar = {};
global.foo.bin = {};
global.foo.bax = {};

/* modules */
var exporter = {};
(function (){
  this.exports = "bax";
}).call(exporter);
global.foo.bax = exporter.exports;
;(function (){
  this.Bax = foo.bax;
  this.Bin = "Bin";
}).call( global.foo.bin );
;(function () {
  this.Bar = "FooBar";
}).call( global.foo.bar );
;(function (){
  this.Foo = 'foo';
  this.Bin = foo.bin;
  this.Bar = foo.bar.Bar;
}).call( global.main );

})(this);