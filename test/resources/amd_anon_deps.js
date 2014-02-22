define([
  'resources/named',
  'resources/anon'
], function(named, anon){

  return {
    loaded: named + "|"+ anon
  };

});