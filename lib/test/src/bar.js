z().
imports('fud.foo', 'foo').
imports('fud.bin', 'bin').

exports(function(__){
  
  var bar = 'bar' + __.foo;
  var bin = 'bin' + __.bin;

  var testClass = z.Class({
    
    __init__:function(){
      this.foo = 'foo'
    }
  
  });

  return {
    bar: bar,
    testClass: testClass
  };

});