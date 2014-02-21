z.setup({
  root: '',
  shim: {},
  alias: {
    'fud': 'test.src'
  }
});

z('main').
imports('fud.bar','*').
exports(function(__){
  
  var fud = __.bar;

  return {
    fud: fud
  };

});