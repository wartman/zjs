describe('z', function () {

	// it('accepts a name and an environment', function () {
	// 	var mod = z('Test.Module.Constructor', function () {});
	// 	expect(mod.getName()).to.equal('Test.Module.Constructor');
	// 	expect(mod.getNamespace()).to.equal('Test.Module');
	// 	expect(mod.getEnvironment()).to.be.a('function');
	// });

	it('loads previously defined module', function (done) {
		z('Test.Imports.ModuleTarget', function () {
			Test.Imports.ModuleTarget = 'target';
		});
		// Note: all the below is done automatically if you
		// pass a function as the second argument to z.
		z('Test.Imports.Module', function () {
			z.imports('Test.Imports.ModuleTarget');
			expect(Test.Imports.ModuleTarget).to.equal('target');
			done();
		});
	});

	it('parses module name as path, loads external script', function (done) {
		z('Test.Imports.Script', function () {
			z.imports('fixtures.Single');
			expect(fixtures.Single).to.equal('one');
			done();
		});
	});

  it('waits for a callback (when present) for async ops', function (done) {
    var waited = 'nope';
    z('tests.imports.waited', function (moduleDone) {
      setTimeout(function () {
        waited = 'yep';
        console.log('done');
        moduleDone();
      }, 20);
    });
    z('tests.imports.waiting', function () {
      var glob = z.imports('tests.imports.waited');
      expect(waited).to.equal('yep');
      done();
    });
  });

	it('shims globals', function (done) {
    z('tests.imports.globalShim', function (moduleDone) {
      z.load('fixtures/global.js', function () {
        console.log(globalItem);
        tests.imports.globalShim = window.globalItem;
        moduleDone();
      });
    })
		z('Test.Imports.Globals', function () {
			var glob = z.imports('tests.imports.globalShim');
			expect(glob).to.equal('globalItem');
			done();
		});
	});

	it('imports a mapped global', function (done) {
		z.map('globalMapped', 'fixtures/globalMapped.js');
		z('Test.Imports.MappedGlobal', function () {
			z.imports('globalMapped');
			expect(globalMapped).to.equal('globalMapped');
			done();
		});
	});

	it('imports many deps recursively from external files', function (done) {
    z('Test.Imports.Stress', function (stress) {
      z.imports(
        'fixtures.stress.one',
        'fixtures.stress.two',
        'fixtures.stress.three'
      );
      var stress = fixtures.stress;
      expect(stress.one.One).to.be.equal('one');
      expect(stress.one.Foo).to.be.equal('Foo');
      expect(stress.two.Two).to.be.equal('two');
      expect(stress.three.Three).to.be.equal('three');
      done();
    });
  });

	describe('#imports', function () {

		it('imports a list', function (done) {
      z('app.foo', function () {
        app.foo = 'foo';
      });
      z('app.bar', function () {
        app.bar = 'bar';
      });
      z('tests.imports.list', function () {
        z.imports(
          'app.foo',
          'app.bar'
        );
        expect(app.foo).to.equal('foo');
        expect(app.bar).to.equal('bar');
        done();
      });
    });

    it('imports single items', function (done) {
      z('app.biz', function () {
        app.biz = {
          foo: 'foo',
          bar: 'bar'
        };
      });
      z('tests.imports.single', function () {
        var biz = z.imports('app.biz');
        expect(biz).to.deep.equal({
          foo: 'foo',
          bar: 'bar'
        });
        done();
      });
    });

	});

  it('registers namespaces/modules', function () {
    z('main');
    expect(z.env.namespaces['main']).to.be.an('undefined');
    z('tests.namespaces');
    expect(z.env.namespaces['tests']).to.be.true;
    expect(z.env.namespaces['tests.namespaces']).to.be.an('undefined');
    z('tests.sub.namespaces');
    expect(z.env.namespaces['tests.sub']).to.be.true;
    expect(z.env.namespaces['tests.sub.namespaces']).to.be.an('undefined');
    expect(z.env.modules['tests.sub.namespaces']).to.be.an('object');
  });

	describe('#config', function () {

    it('sets an item', function () {
      z.config('foo', 'bar');
      expect(z.configuration.foo).to.be.equal('bar');
    });

    it('sets several objects at a time', function () {
      z.config({
        bar: 'bin',
        baz: 'baz'
      });
      expect(z.configuration.bar).to.be.equal('bin');
      expect(z.configuration.baz).to.be.equal('baz');
    });

    it('gets a value, or returns false if undefined', function () {
      z.config('foo', 'bar');
      expect(z.config('foo')).to.be.equal('bar');
      expect(z.config('frazzle')).to.be.false;
      z.config('notFalse', '');
      expect(z.config('notFalse')).to.not.be.an('undefined');
    });

    it('passes things in the "map" key to z.map', function () {
    	z.config('map', {
    		'FooBix': 'some/path/to/file.js'
    	});
			expect(z.sys.getPath('FooBix')).to.equal('some/path/to/file.js');
    });

    it('passes things in the "namespaces" key to z.map.namespaces', function () {
    	z.config('namespaces', {
    		'Froo': 'some/path/to/Froo'
    	});
			expect(z.sys.getPath('Froo.Blix')).to.equal('some/path/to/Froo/Blix.js');
    });

  });

	describe('#map', function () {

		it('maps a single item', function () {
			z.config('root', '');
			z.map('Item', 'MyLib.Item');
			expect(z.sys.getPath('Item')).to.equal('MyLib/Item.js');
			z.map('ItemTwo', 'MyLib/ItemTwo.js');
			expect(z.sys.getPath('ItemTwo')).to.equal('MyLib/ItemTwo.js');
		});

		it('maps namespaces', function () {
			z.config('root', '');
			z.map.namespace('Foo.Bar', 'libs/FooBar/');
			expect(z.sys.getPath('Foo.Bar.Bin')).to.equal('libs/FooBar/Bin.js');
			expect(z.sys.getPath('Foo.Bar.Bax.Bin')).to.equal('libs/FooBar/Bax/Bin.js');
		});

	});

});