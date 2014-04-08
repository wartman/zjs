z('fixtures.stress.one').
imports('fixtures.stress.item.foo').
exports(function(){
  this.One = "one";
  this.Foo = fixtures.stress.item.foo;
});