(function(){

  module('z');

  test('namespaces', function () {

    z('main');
    ok(z.env.namespaces['main'], 'Top level namespaces are registered.');

    z('moduleTest.namespaces');
    ok(z.env.namespaces['moduleTest'], 'Registers namespace, not component.');
    ok(!z.env.namespaces['moduleTest.namespaces'], 'Registers namespace, not component.');

    z('moduleTest.sub.namespaces');
    ok(z.env.namespaces['moduleTest.sub'], 'Registers namespace, not component.');
    ok(!z.env.namespaces['moduleTest.sub.namespaces'], 'Registers namespace, not component.');

  });

  test('Get a dep', function () {

    stop();

    z('moduleTest.exports').
    imports('fixtures.exports').
    exports(function(){
      start();
      equal(fixtures.exports.Foo, 'Foo', 'Modules imported');
    });

  });

  test('Stress test', function(){

    stop();

    z('moduleTest.stress').
    imports('fixtures.stress.one').
    imports('fixtures.stress.two').
    imports('fixtures.stress.three').
    exports(function(){
      start();
      var stress = fixtures.stress;
      equal(stress.one.One, 'one');
      equal(stress.one.Foo, 'Foo');
      equal(stress.two.Two, 'two');
      equal(stress.three.Three, 'three');
    });

  });

  test('mapping', function () {

    z.map('fixtures/map/mapped.js', [
      'foo.mapped'
    ]);

    equal(z.getMappedPath('foo.mapped'), 'fixtures/map/mapped.js', 'Path was found');

    z.map('fixtures/fake/module.js', [
      'foo.fake',
      'foo.fake.*',
      'foo.**.many',
      'foo.*.one'
    ]);

    equal(z.getMappedPath('foo.fake'), 'fixtures/fake/module.js', 'Path was found');
    equal(z.getMappedPath('foo.fake.Bar'), 'fixtures/fake/module.js', 'Path was found');
    equal(z.getMappedPath('foo.fake.Baz'), 'fixtures/fake/module.js', 'Path was found');
    equal(z.getMappedPath('foo.fake.Foo'), 'fixtures/fake/module.js', 'Path was found automatically');

    equal(z.getMappedPath('foo.things.many'), 'fixtures/fake/module.js', '** matches many segments');
    equal(z.getMappedPath('foo.things.etc.many'), 'fixtures/fake/module.js', '** matches many segments');
    notEqual(z.getMappedPath('foo.things.etc.fud'), 'fixtures/fake/module.js', '** does not match when last segment is incorrect');

    equal(z.getMappedPath('foo.things.one'), 'fixtures/fake/module.js', '* matches one segment');
    notEqual(z.getMappedPath('foo.things.etc.one'), 'fixtures/fake/module.js', '* does not match many segments');

  });

  test('Load mapped module', function () {

    z.map('fixtures/map/mapped.js', [
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
      map: 'fixtures/shim.js',
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

      imports('fixtures.exports');

      exports(function(){
        start();
        equal(fixtures.exports.Foo, 'Foo', 'Modules imported, alternate API works.');
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

  });

  test('Ajax plugins', function () {
    
    stop();

    z('moduleTest.getTxt', function (imports, exports) {
      imports('txt!fixtures.file.txt');
      exports(function () {
        start();
        equal(fixtures.file.txt, 'loaded', 'File was loaded.');
      });
    });

  });

})();