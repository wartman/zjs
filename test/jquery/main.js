z.setup({
  module: {
    root: '',
    shim: {
      'jquery': {
        src: '../../node_modules/jquery/dist/jquery.js',
      }
    },
    alias: {
      'z': 'libs.z',
      'alias': 'actual'
    }
  }
});

z.module('main').
imports({from:'jquery', uses:['*'] }).

exports(function(__){
  console.log(z.module.registry);
  console.log(__.jquery);
}).enable();