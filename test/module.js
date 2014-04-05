(function(){
  
  module('z mini');

  test('Get a dep', function(){

    stop();

    z('moduleTest.exports').
    import('resources.exports').
    export(function(){
      start();
      equal(resources.exports.Foo, 'Foo', 'Modules imported');
    });

  });

  test('Stress test', function(){

    stop();

    z('moduleTest.stress').
    import('resources.stress.one').
    import('resources.stress.two').
    import('resources.stress.three').
    export(function(){
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
    import('foo.mapped').
    export(function(){
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
    import('shim').
    export(function(){
      start();
      equal(shim, 'shimmed', 'Shimmed file loaded');
      ok(z.env.namespaces['shim'], 'Shim namespace saved.');
    });

  });

})();