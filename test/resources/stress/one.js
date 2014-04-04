z('resources.stress.one').
import('resources.stress.item.foo').
export(function(){
  this.One = "one";
  this.Foo = resources.stress.item.foo;
});