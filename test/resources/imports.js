/**
 * Tests importing.
 */
z('resources.imports')
.imports('resources.named', 'named')
.imports('resources.anon', 'anon')
.exports(function(__){
  return {
    named: __.named,
    anon: __.anon
  };
});