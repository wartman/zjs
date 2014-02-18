/**
 * Tests importing.
 */
z.module('tests.resources.module.imports')
.imports(
  {from:'tests.resources.module.named', uses:'named'},
  {from:'tests.resources.module.anon', uses:'anon'}
).exports(function(__){
  return {
    named: __.named,
    anon: __.anon
  };
});