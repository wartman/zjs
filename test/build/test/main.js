z.env.root = 'test/build/test/';

module('main').
import('foo.bar').
export(function(){
  this.Foo = 'foo';
});