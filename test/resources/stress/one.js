z('resources.stress.one').
imports('resources.stress.item.foo').
exports(function(){
  this.One = "one";
  this.Foo = resources.stress.item.foo;
});