define([
  'resources/imports'
], function(imports){

  return {
    loaded: imports.named + "|"+imports.anon
  };

});