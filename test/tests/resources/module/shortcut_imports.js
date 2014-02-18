/**
 * Tests importing with the imports shortcut.
 */
imports(
  {from:'tests.resources.module.anon', uses:'anon'},
  {from:'tests.resources.module.named', uses:'named'}
).exports(function(__){
  return {
    named: __.named,
    anon: __.anon
  };
});