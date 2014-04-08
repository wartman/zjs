z('resources.exports').
imports('resources.foo').
exports(function(){
  this.Foo = resources.foo;
  this.Bar = "Bar";
});