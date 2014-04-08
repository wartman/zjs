z.config('root', 'test/build/test/');

z('main').
imports('foo.bar').
imports('foo.bin').
exports(function(){
  this.Foo = 'foo';
  this.Bin = foo.bin;
  this.Bar = foo.bar.Bar;
});