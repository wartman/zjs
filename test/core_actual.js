(function(){
  
  module('z core actual');

  test('imports', function(){

    stop();

    z('test.imports.named').
    imports('resources.named').
    exports(function(__){
      start();
      equal(__.named.named, 'named', 'Got named');
    });

    stop();

    z('test.imports.anon').
    imports('resources.anon').
    exports(function(__){
      start();
      equal(__.anon.anon, 'anon', 'Got anon');
    });

    stop();

    z('test.imports.imports').
    imports('resources.imports').
    exports(function(__){
      start();
      deepEqual(__.imports, {named:'named', anon:'anon'}, 'Got external');
    });

  });

  test('stress', function(){

    stop();

    z('test.stress').
    imports('resources.stress_one').
    exports(function(__){
      start();
      equal(__.stress_one.stress, 'one|two|three', 'stress test one passed');
      equal(__.stress_one.stressTxt, 'stress one', 'txt file imported.');
      //equal(__.stress_two.stress, 'four|five|six', 'stress test two passed');
      //equal(__.stress_two.stressTxt, 'stress two|stress three', 'txt file imported.');
    })

  });

  test("define (AMD style integration)", function(){

    stop();

    define('test.amd.define', ["resources/named"], function(named){

      equal(named.named, 'named', 'Does AMD style stuff work?');

      start();

    });

    stop();

    z('test.amd.anon').
    imports('resources.amd_anon').
    exports(function(__){

      equal(__.amd_anon.loaded, 'loaded', 'Anon AMD define with no deps was loaded');

      start();

    });

    stop();

    z('test.amd.anonDeps').
    imports('resources.amd_anon_deps').
    exports(function(__){

      equal(__.amd_anon_deps.loaded, 'named|anon', 'Anon AMD define was loaded and got deps');

      start();

    });

    stop();

    z('test.amd.anonExports').
    imports('resources.amd_anon_exports').
    exports(function(__){

      equal(__.amd_anon_exports.loaded, 'named|anon', 'Anon AMD define was loaded, got deps, and exports worked');

      start();

    });

  });

})();