describe('z', function () {

	it('accepts a name and an environment', function () {
		var mod = z('Test.Module.Constructor', function () {});
		expect(mod.getName()).to.equal('Test.Module.Constructor');
		expect(mod.getNamespace()).to.equal('Test.Module');
		expect(mod.getEnvironment()).to.be.a('function');
	});

	it('loads previously defined module', function (done) {
		z('Test.Imports.ModuleTarget', function () {
			Test.Imports.ModuleTarget = 'target';
		});
		// Note: all the below is done automatically if you
		// pass a function as the second argument to z.
		var mod = new z('Test.Imports.Module');
		mod.setEnvironment(function () {
			z.imports('Test.Imports.ModuleTarget');
			expect(Test.Imports.ModuleTarget).to.equal('target');
			done();
		});
		mod.parse();
		mod.enable();
	});

	it('parses module name as path, loads external script', function (done) {
		var mod = new z('Test.Imports.Script')
		mod.setEnvironment(function () {
			z.imports('fixtures.Single');
			expect(fixtures.Single).to.equal('one');
			done();
		});
		mod.parse();
		mod.enable();
	});

	it('imports globals', function (done) {
		z('Test.Imports.Globals', function () {
			z.imports('fixtures.global').global('globalItem');
			expect(globalItem).to.equal('globalItem');
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
      z.imports('fixtures.stress.one');
      z.imports('fixtures.stress.two');
      z.imports('fixtures.stress.three');
      var stress = fixtures.stress;
      expect(stress.one.One).to.be.equal('one');
      expect(stress.one.Foo).to.be.equal('Foo');
      expect(stress.two.Two).to.be.equal('two');
      expect(stress.three.Three).to.be.equal('three');
      done();
    });
  });

  describe('(instance methods)', function () {

		describe('#setName', function () {

			it('Sets the name and namespace', function () {
				var mod = z();
				mod.setName('Test.Module.SetName');
				expect(mod.getName()).to.equal('Test.Module.SetName');
				expect(mod.getNamespace()).to.equal('Test.Module');
			});

		});

		describe('#setEnvironment', function () {

			it('Sets the environment', function () {
				var mod = z();
				mod.setEnvironment(function () {});
				expect(mod.getEnvironment()).to.be.a('function');
			});

		});

		describe('#setImport', function () {

			it('Sets an import', function () {
				var mod = z('Test.Parser');
				mod.setImport('Test.Fake.Imports');
				mod.setImport('Test.Fake.ImportTwo', {using: 'Fake.Plugin'});
				mod.setImport('Test.Fake.ImportThree', {alias: 'Fake.Alias'});
				mod.setImport('Test.Fake.ImportFour', {global: 'Four', alias: 'Fake.Four'});
				expect(mod.getImports()).to.deep.equal([
					{
						dependency: 'Test.Fake.Imports',
						using: false,
						global: false,
						alias: false	
					},
					{
						dependency: 'Test.Fake.ImportTwo',
						using: 'Fake.Plugin',
						global: false,
						alias: false	
					},
					{
						dependency: 'Test.Fake.ImportThree',
						using: false,
						global: false,
						alias: 'Fake.Alias'	
					},
					{
						dependency: 'Test.Fake.ImportFour',
						using: false,
						global: 'Four',
						alias: 'Fake.Four'
					}
				]);
			});

		});

		describe('#parse', function () {

			it('detects imports', function () {
				var mod = z('Test.Parser');
				mod.setEnvironment(function () {
					z.imports('Test.Fake.Imports');
					z.imports('Test.Fake.ImportTwo').using('Fake.Plugin');
					z.imports('Test.Fake.ImportThree').as('Fake.Alias');
					z.imports('Test.Fake.ImportFour').global('Four').as('Fake.Four');
				});
				mod.parse();
				expect(mod.getImports()).to.deep.equal([
					{
						dependency: 'Test.Fake.Imports',
						using: false,
						global: false,
						alias: false	
					},
					{
						dependency: 'Test.Fake.ImportTwo',
						using: 'Fake.Plugin',
						alias: false,
						global: false,
					},
					{
						dependency: 'Test.Fake.ImportThree',
						using: false,
						global: false,
						alias: 'Fake.Alias'	
					},
					{
						dependency: 'Test.Fake.ImportFour',
						using: false,
						global: 'Four',
						alias: 'Fake.Four'
					}
				]);
			});

		});

	});

	describe('#imports', function () {

		describe('#as', function () {

			it('alias an import', function () {
				z('Test.Imports.Alias');
				Test.Imports.Alias = "foo";
				z.imports('Test.Imports.Alias').as('Test.Imports.Aliased');
				expect(Test.Imports.Aliased).to.equal('foo');
			});
			
		});

		describe('#using', function () {

			it('uses a plugin', function (done) {
				z.plugin.register('Tests.Plugin.One', function (req, next, error) {
					z(req, function () {
						var obj = z.sys.getObjectByName(req);
						obj.foo = 'foo';
					}).done(next, error);
				});
				z('tests.imports.using', function () {
					z.imports('tests.imports.usingTarget').using('Tests.Plugin.One');
					expect(tests.imports.usingTarget.foo).to.equal('foo');
					done();
				});
			});

			it('uses an external plugin', function (done) {
				z('tests.imports.usingExternal', function () {
					z.imports('tests.imports.usingExternalTarget').using('fixtures.plugin');
					expect(tests.imports.usingTarget.foo).to.equal('foo');
					done();
				});
			});

		});

	});

	describe('#plugin', function () {

		describe('#register', function () {

			it('registers a plugin', function () {
				z.plugin.register('Test.Plugin.Two', function (req, next, error) {
					// code
				});
				expect(z.env.plugins['Test.Plugin.Two']).to.be.a('function');
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