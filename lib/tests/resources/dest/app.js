/*test.src.main*/
fit.setup({"module":{"root":"","shim":{},"alias":{"fud":"test.src"}}});

/*main*/
fit.module('main').
imports({"from":"fud.bar","uses":false,"as":"script","url":"test/src/bar.js"}).
exports(function (__){
  
  var fud = __.bar;

  return {
    fud: fud
  };

});

/*fud.bar*/
fit.module('fud.bar').
imports({"from":"fud.foo","uses":["foo"],"as":"script","url":"test/src/foo.js"}).
imports({"from":"fud.bin","uses":["bin"],"as":"script","url":"test/src/bin.js"}).
exports(function (__){
  
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

/*fud.foo*/
fit.module('fud.foo').
exports(function (__){
  
  var foo = 'foo';

  return {
    foo: foo
  };

});

/*fud.bin*/
fit.module('fud.bin').
imports({"from":"fud.foob","uses":["foob"],"as":"script","url":"test/src/foob.js"}).
exports(function (__){
  
  var bin = 'bin' + __.foob;

  return {
    bin: bin
  };

});

/*fud.foob*/
fit.module('fud.foob').
exports(function (__){
  
  var foob = 'foob';

  return {
    foob: foob
  };

});

