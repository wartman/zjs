z.setup({
  root: '',
  shim: {
    'fud.foo': {
      src: 'test/src/foo'
    }
  },
  alias: {
    'fud': 'test.src'
  }
});

z('main').
imports('fud.bar','*').
exports(function(__){
  
  document.getElementById('done').innerHTML = 'result should be barfoo: ' + __.bar.bar;

  var fud = __.bar;

  return {
    fud: fud
  };

});