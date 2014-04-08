z('fixtures.exports').
imports('fixtures.foo').
exports(function(){
  this.Foo = fixtures.foo;
  this.Bar = "Bar";
});