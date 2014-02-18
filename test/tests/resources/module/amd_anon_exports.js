define([
  'tests/resources/module/imports'
], function(imports){

  exports.loaded = imports.named + "|"+ imports.anon

});