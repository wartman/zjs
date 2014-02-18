define([
  'tests/resources/module/imports'
], function(imports){

  return {
    loaded: imports.named + "|"+imports.anon
  };

});