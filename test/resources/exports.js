z('resources.exports').
import('resources.foo').
export(function(){
  this.Foo = resources.foo;
  this.Bar = "Bar";
});