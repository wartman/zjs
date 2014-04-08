(function (global) {
/* namespaces */
var app = global.app = {};
var fixtures = global.fixtures = {};
global.fixtures.stress = {};
global.fixtures.file = {};
global.fixtures.stress.item = {};

/* modules */
var exporter;
;(function (){
  this.exports = "Foo";
}).call( exporter = {} );
global.fixtures.stress.item.foo = exporter.exports;
;(function anonymous() {
  this.exports = 'loaded'
}).call( exporter = {} );
global.fixtures.file.txt = exporter.exports;
;(function (){
  this.Three = "three";
}).call( global.fixtures.stress.three = {} );
;(function (){
  this.Two = "two";
}).call( global.fixtures.stress.two = {} );
;(function (){
  this.One = "one";
  this.Foo = fixtures.stress.item.foo;
}).call( global.fixtures.stress.one = {} );
;(function (){
  this.exports = "the main file";
}).call( exporter = {} );
global.app.main = exporter.exports;

})(this);