(function(global){
/* namespaces */
global.main = {};
global.foo = {};
global.foo.bar = {};

/* modules */
;(function (){
  this.Foo = 'foo';
}).call( global.main );
;(function () {
  this.Bar = "Bar";
}).call( global.foo.bar );

})(this);