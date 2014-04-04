z.env.root = 'test/build/test/';

module('main').
import('foo.bar').
import('foo.bin').
export(function(){
  this.Foo = 'foo';
  this.Bin = foo.bin;
  this.Bar = foo.bar.Bar;
});