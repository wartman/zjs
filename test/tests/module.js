(function(z, undefined){

  module('Module Test');

  test("z.module.exports", function(){

    z.module('tests.basic')
    .exports(function(__){
      return {
        exports: 'basic'
      }
    }).enable();

    equal(z.module.has('tests.basic'), true, "Module ceated.");

  });

  test("z.module.get", function(){

    stop();

    z.module('tests.get')
    .exports(function(__){
      return{
        one: 1,
        two: 2
      }
    }).enable(function(){

      start();

      var actual = z.module.get('tests.get');
      equal(actual.get.one + '|' + actual.get.two, '1|2', 'Got entire definition, namespaced to last part of module name.' );

      actual = z.module.get('tests.get', 'one');
      equal(actual.one, 1, 'Got single component');

      actual = z.module.get('tests.get', ['one', 'two']);
      equal(actual.one + '|' + actual.two, '1|2', 'Got several items.');

    });

  });

  test("z.module.imports (locally defined)", function(){

    stop();

    z.module('tests.target').exports(function(__){
      return {
        target: 'target'
      };
    });

    z.module('tests.imports')
    .imports('tests.target') // Use the module we just created
    .exports(function(__){
      return {
        imports: 'imported: ' + __.target.target
      };
    });

    z.module('tests.imports_two')
    .imports('tests.imports')
    .exports(function(__){
      return {
        one: __.imports.imports,
        two: "imported: " + 'another'
      };
    });

    z.module('tests.imports_components')
    .imports({from:'tests.imports_two', uses:['one', 'two']})
    .exports(function(__){
      equal(
        __.one + "|" + __.two,
        "imported: target|imported: another",
        "Did did the module return the requested objects?"
      );

      start();
    }).enable();

  });

  test("z.module.setup + actual imports from external", function(){

    stop();

    z.module.setup({
      root: ''
    });

    z.module('tests.external')
    .imports(
      {from:'tests.resources.module.named', uses:'named'},
      {from:'tests.resources.module.anon', uses:'anon'}
    ).exports(function(__){
      start();

      equal(__.named, 'named', 'Named module imported.');
      equal(__.anon, 'anon', 'Anon file imported, named correctly.');
    }).enable();

    stop();

    z.module('tests.external_imports')
    .imports(
      {from:'tests.resources.module.imports', uses:['named', 'anon']}
    ).exports(function(__){
      start();
      equal(__.named + '|' + __.anon, 'named|anon', 'external file imported modules as expected.');
    }).enable();

  });

  test("define (AMD style integration)", function(){

    stop();

    define('test.amd.define', ["tests/resources/module/named"], function(named){

      equal(named.named, 'named', 'Does AMD style stuff work?');

      start();

    });

    stop();

    z.module('test.amd.anon').
    imports('tests.resources.module.amd_anon').
    exports(function(__){

      equal(__.amd_anon.loaded, 'loaded', 'Anon AMD define with no deps was loaded');

      start();

    });

    stop();

    z.module('test.amd.anonDeps').
    imports('tests.resources.module.amd_anon_deps').
    exports(function(__){

      equal(__.amd_anon_deps.loaded, 'named|anon', 'Anon AMD define was loaded and got deps');

      start();

    });

    stop();

    z.module('test.amd.anonExports').
    imports('tests.resources.module.amd_anon_exports').
    exports(function(__){

      equal(__.amd_anon_exports.loaded, 'named|anon', 'Anon AMD define was loaded, got deps, and exports worked');

      start();

    });

    z.module.start();

  });

  test('module.shim', function(){

    z.module.setup({
      shim: {
        'foo': {
          src: 'foo/bar.js'
        }
      },
      alias: {
        'fiz': 'lib.fiz'
      }
    });
    var actual = z.module.findUrl({from:'foo'});
    equal(actual, 'foo/bar.js', 'Modules are shimmed');

    var actual = z.module.findUrl({from:'fiz.module'});
    equal(actual, 'lib/fiz/module.js', 'Alias was appened.');

  });

  test('imports file', function(test){

    // Note: this test requires a server to run!

    stop();

    z.module('tests.file')
    .imports({from:'tests.resources.text.file', type:'txt', as:'file'})
    .exports(function(__){
      start();
      equal(__.file, "Was fetched.", 'Generic file was loaded.');
    }).enable();

  });

  test("Shortcuts", function(){

    stop();

    z.module('tests.external_shortcuts')
    .imports(
      {from:'tests.resources.module.shortcut_imports', uses:['named', 'anon']},
      {from:'tests.resources.module.shortcut_exports', uses:'*'}
    ).exports(function(__){
      start();
      equal(__.named + '|' + __.anon, 'named|anon', 'external file imported modules as expected.');
      equal(__.shortcut_exports.exports, 'exports', 'exported as expected.');
    }).enable();

  });

  test("imports files AND scripts, stress testing", function(){

    stop();

    z.module('tests.stress')
    .imports(
      {from:'tests.resources.module.stress_one', uses:'*'},
      {from:'tests.resources.module.stress_two', uses:'*'}
    ).exports(function(__){
      start();
      equal(__.stress_one.stress, 'one|two|three', 'stress test one passed');
      equal(__.stress_one.stressTxt, 'stress one', 'txt file imported.');
      equal(__.stress_two.stress, 'four|five|six', 'stress test two passed');
      equal(__.stress_two.stressTxt, 'stress two|stress three', 'txt file imported.');
    }).enable();

  });

  test('plugins', function(){

    stop();

    z.module.plugin('test', function(req, res, rej){
      start();
      ok(true, 'Plugin was called.');

      z.module('fake').exports(function(){ return {fake:'fake'} }).enable();
      res();
    });

    z.module('test.plugin')
    .imports(
      {from:'fake', as:'test'}
    ).exports(function(__){
      // no-op
    }).enable();

  });

  // test('error', function(){

  //   stop();

  //   z.module('tests.error').
  //   imports('not.a.module').
  //   exports(function(__){
  //     // zip
  //   });

  //   z.App.start().catches(function(e){
  //     start();
  //     ok('Loaded');
  //   });

  // });

})(window.z || {});