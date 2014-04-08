(function(){
  
  module('z mini');

  test('Get a dep', function(){

    stop();

    z('moduleTest.exports').
    imports('resources.exports').
    exports(function(){
      start();
      equal(resources.exports.Foo, 'Foo', 'Modules imported');
    });

  });

  test('Stress test', function(){

    stop();

    z('moduleTest.stress').
    imports('resources.stress.one').
    imports('resources.stress.two').
    imports('resources.stress.three').
    exports(function(){
      start();
      var stress = resources.stress;
      equal(stress.one.One, 'one');
      equal(stress.one.Foo, 'Foo');
      equal(stress.two.Two, 'two');
      equal(stress.three.Three, 'three');
    });

  });

  test('mapping', function () {

    z.map('resources/map/mapped.js', [
      'foo.mapped'
    ]);

    equal(z.getMappedPath('foo.mapped'), 'resources/map/mapped.js', 'Path was found');

    z.map('resources/fake/module.js', [
      'foo.fake',
      'foo.fake.*',
      'foo.fake.Bar',
      'foo.fake.Baz'
    ]);

    equal(z.getMappedPath('foo.fake'), 'resources/fake/module.js', 'Path was found');
    equal(z.getMappedPath('foo.fake.Bar'), 'resources/fake/module.js', 'Path was found');
    equal(z.getMappedPath('foo.fake.Baz'), 'resources/fake/module.js', 'Path was found');
    equal(z.getMappedPath('foo.fake.Foo'), 'resources/fake/module.js', 'Path was found automatically');

  });

  test('Load mapped module', function () {

    z.map('resources/map/mapped.js', [
      'foo.*'
    ]);

    stop();

    z('moduleTest.mapped').
    imports('foo.mapped').
    exports(function(){
      start();
      equal(foo.mapped, 'mapped', 'Module was mapped');
    });

  });

  test('shim', function(){

    z.shim('shim', {
      map: 'resources/shim.js',
      imports: false
    });

    stop();

    z('moduleTest.shimmed').
    imports('shim').
    exports(function(){
      start();
      equal(shim, 'shimmed', 'Shimmed file loaded');
      ok(z.env.namespaces['shim'], 'Shim namespace saved.');
    });

  });

  test('Don\'t load modules if already defined', function () {

    z('foo.bar').exports(function(){
      this.Bin = 'Loaded Once';
    });

    stop();

    z('moduleTest.loadOnce').
    imports('foo.bar').
    exports(function () {
      start();
      equal(foo.bar.Bin, 'Loaded Once', 'Didn\'t look for another module');
    });

  });

  test('alertnate API', function () {

    stop();

    z('moduleTest.callbackApi', function (imports, exports) {

      imports('resources.exports');

      exports(function(){
        start();
        equal(resources.exports.Foo, 'Foo', 'Modules imported, alternate API works.');
      });

    });

  });

  test('Plugins', function () {
    stop();

    z.plugin('test', function (module, next, error) {
      z(module).exports(function(){ this.exports = "plugin"; }).done(next);
    });

    z('moduleTest.plugin', function (imports, exports) {

      imports( 'test!plugin.test' );
      exports(function () {
        start();
        equal( plugin.test, 'plugin', 'Plugin ran.' );
      })

    });

  })

})();