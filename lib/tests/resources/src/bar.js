imports({from:'fud.foo', uses:['foo'] }).
imports({from:'fud.bin', uses:['bin'] }).

exports(function(__){
  
  var bar = 'bar' + __.foo;
  var bin = 'bin' + __.bin;

  var testClass = fit.Class.create({
    
    __init__:function(){
      this.foo = 'foo'
    }
  
  });

  return {
    bar: bar,
    testClass: testClass
  };

});