(function(){
  
  module('z core');

  // This test suite does not test actual script loading.
  // For script loading, see test/script.js and test/core/actual.js

  test('define', function(){
    z('test.define', function(){
      return {
        foo: 'foo',
        bar: 'bar'
      } 
    });

    ok(z.modules.hasOwnProperty('test.define'), 'Module was registered.');
  });

  test('use', function(){

    stop();

    z('test.use', function(){
      return {
        foo: 'foo',
        bar: 'bar'
      } 
    }).done(function(){

      start();

      var actual = z('test.use').use('foo');
      equal(actual, 'foo', 'Module export was retrieved.');

      actual = z('test.use').use(['foo']);
      deepEqual(actual, {foo:'foo'}, 'Passing an array always returns an object');

      actual = z('test.use').use(['foo @ bar']); // spaces should be ignored
      deepEqual(actual, {bar:'foo'}, 'Exported using an alias');

      actual = z('test.use').use('foo @ bar');
      equal(actual, 'foo', 'Passing a string never returns an object, even with an alias');

      actual = z('test.use').use(['foo', 'bar']);
      deepEqual(actual, {foo:'foo', bar:'bar'}, 'Multiple exports can be retrieved');

      actual = z('test.use').use(['foo @ baz', 'bar @ bin']);
      deepEqual(actual, {baz:'foo', bin:'bar'}, 'Exports can be aliased with "@"');

    });

  });

  test('has', function(){

    equal(z.has('not.a.module'), false, 'Undefined modules return false');

    z('test.has', function(){
      return {
        has: 'has'
      };
    });

    equal(z.has('test.has'), true, 'Defined modules return true.')

  });

  test('imports', function(){

    z('test.foo', function(){
      return {
        foo: 'foo',
        bin: 'bin'
      };
    });

    z('test.bar', function(){
      return {
        bar: 'bar'
      };
    });

    z('test.baz', function(){
      return {
        baz: 'baz'
      }
    });

    stop();

    // Unlike z#use, imports should always return an object
    z('test.imports').
    imports('test.foo', ['foo', 'bin']).
    imports('test.bar', 'bar').
    imports('test.baz').
    exports(function(__){
      start();
      equal(__.foo + __.bar + __.bin, 'foobarbin', 'Components imported');
      equal(__.baz.baz, 'baz', 'Importing without specifying exports retrieves the entire module. Uses the last segment of the name.');
    });

  });

  test('imports aliased', function(){

    z('test.afoo', function(){
      return {
        foo: 'foo',
        bin: 'bin'
      };
    });

    z('test.abar', function(){
      return {
        bar: 'bar'
      };
    });

    z('test.abaz', function(){
      return {
        baz: 'baz'
      }
    });

    stop();

    z('test.aimports').
    imports('test.afoo', ['foo @ afoo', 'bin @ abin']). // Spaces should be ignored.
    imports('test.abar', 'bar @ abar').
    imports('test.abaz @ baz').
    exports(function(__){
      start();
      equal(__.afoo + __.abar + __.abin, 'foobarbin', 'Components imported, aliased');
      equal(__.baz.baz, 'baz', 'Module imported, aliased');
    });

  });

  test('done', function(){

    // Reset the modules.
    z.modules = {};

    z('test.foo', function(){
      return {
        foo: 'foo',
        bin: 'bin'
      };
    });

    z('test.bar', function(){
      return {
        bar: 'bar'
      };
    });

    z('test.baz', function(){
      return {
        baz: 'baz'
      }
    });

    z('test.done').
    imports('test.foo', ['foo', 'bin']).
    imports('test.bar', 'bar').
    imports('test.baz').
    exports(function(__){
      return {
        foo: __.foo,
        bar: __.bar,
        baz: __.bin
      };
    });

    stop();

    z('test.done').done(function(){
      start();
      ok('Ran when module ready');
      deepEqual(z('test.done'), this, '"this" bound correctly');
      deepEqual(this.use(['foo', 'bar', 'baz']), {foo:'foo',bar:'bar',baz:'bin'}, 'Exports accessable and ready');
    });

  });

  test('exports', function(){

    // Reset the modules.
    z.modules = {};

    z('test.foo', function(){
      return {
        foo: 'foo',
        bin: 'bin'
      };
    });

    z('test.bar', function(){
      return {
        bar: 'bar'
      };
    });

    z('test.baz', function(){
      return {
        baz: 'baz'
      }
    });

    // This is also an exaple of another way (probably a more "correct" one)
    // to write a module
    var Exports = z('test.exports')
      .imports('test.foo', ['foo', 'bin'])
      .imports('test.bar', 'bar')
      .imports('test.baz');

    Exports.exports('exportsFunction', function(__){
      return __.foo + ' foo';
    });

    Exports.exports('exportsObject', {
      foo: 'foo',
      bar: 'bar'
    });

    stop();

    Exports.done(function(){

      start();

      var actual = this.use('exportsFunction');
      equal(actual, 'foo foo', 'Function exported');

      var actual = this.use('exportsObject');
      deepEqual(actual, {foo:'foo', bar:'bar'}, 'Object exported');

    });

    stop();

    z('test.exportsImportable').
    imports('test.exports').
    exports(function(__){
      start();
      var actual = __.exports.exportsFunction;
      equal(actual, 'foo foo', 'Function exported');

      var actual = __.exports.exportsObject;
      deepEqual(actual, {foo:'foo', bar:'bar'}, 'Object exported');
    });

  });

  test('loader and filter API', function(){

    stop();

    z.filter('test.filter', function(req){
      req.tested = 'tested';
      return req;
    });

    z.filter('test.filter2', function(req){
      req.tested = (req.tested || '') + '2';
      return req;
    })

    z.loader('test', {
      method: z.Resolver.extend({
        __init__: function(){
          this.resolve(true);
        }
      }),
      filters: ['test.filter', 'test.filter2'],
      handler: function(req, res, next, err){
        start();
        // Define the request so the loader doesn't throw an error.
        z('fake.request', function(){/*no-op*/});
        ok('plugin was called.');
        equal(req.tested, 'tested2', 'Filters ran and in order expected');
        next();
      }
    });

    z('test.plugin').
    imports('fake.request', '*', {type:'test'}).
    exports(function(){
      /* no op */
    });

  });
  
  test('ensure name', function(){

    // NOTE:
    // This test DOES NOT test for ensured names via a network-load action.
    // Always run test.core.actual

    z.loader('ensure',{
      method: z.Resolver.extend({
        __init__: function(){
          this.resolve(true);
        }
      }),
      handler: function(req, res, next, err){
        // Mock an anonymous module being retrieved
        z(function(){
          return{
            foo: 'foo'
          };
        });

        // Ensure the module is nammed.
        z.ensureModule(req.from);
        next();
      }
    });

    stop();

    z('test.ensuredName').
    imports('test.fake', 'foo', {type:'ensure'}).
    exports(function(__){
      start();
      equal(__.foo, 'foo', 'Module was imported.');
      ok(z.has('test.fake'), 'Module was nammed.');
      equal(z('test.fake').use('foo'), 'foo', 'Module has correct exports.');
    });

  });


})();