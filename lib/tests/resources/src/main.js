fit.setup({
  module: {
    root: '',
    shim: {},
    alias: {
      'fud': 'test.src'
    }
  }
});

fit.module('main').
imports({from:'fud.bar', uses:'*' }).
exports(function(__){
  
  var fud = __.bar;

  return {
    fud: fud
  };

});