describe('z', function () {

  beforeEach(function () {
    z.config('root', '');
    z.config('debug', true);
  })

  describe('#module', function () {

    it('defines a new namespace', function () {
      var mod = z.module('tests.module');
      var namespaces = z.getNamespaces();
      expect(z.env.tests).to.not.be.an('undefined');
      expect(z.env.tests.module).to.be.an('object');
      expect(namespaces.tests).to.be.true;
      expect(mod).to.be.an('object');
      mod.foo = 'foo';
      expect(z.env.tests.module.foo).to.equal('foo');
    });

  });

  describe('#namespace', function () {

    it('ensures a namespace exists', function () {
      z.namespace('testsfoo');
      var namespaces = z.getNamespaces();
      expect(namespaces.testsfoo).to.be.true;
      expect(z.env.testsfoo).to.be.an('object');
    });

  });

  describe('#imports', function () {

    it('returns a previously defined module', function () {
      z.module('tests.imports.target');
      var targ = z.imports('tests.imports.target');
      expect(targ).to.be.an('object');
    });

    it('returns undefined if more then one argument is passed', function () {
      z.module('tests.imports.target2');
      z.module('tests.imports.target3');
      var targ = z.imports(
        'tests.imports.target2',
        'tests.imports.target3'
      );
      expect(targ).to.be.an('undefined');
    });

  });

  describe('#loader', function () {
    
    describe('#parse', function () {

      it('detects imports', function () {
        var mock = function () {
          z.imports(
            'foo.bar',
            'foo.bin',

            'foo.bax'
          );
        };
        var deps = z.loader.parse(mock.toString());
        expect(deps).to.deep.equal([
          'foo.bar',
          'foo.bin',
          'foo.bax'
        ]);
      });

    });

    describe('#parseModulePath', function () {

      it('parses into name and src', function () {
        var mod = z.loader.parseModulePath('foo.bin.bar');
        expect(mod.src).to.equal('foo/bin/bar.js');
        expect(mod.name).to.equal('foo.bin.bar');
        var mod = z.loader.parseModulePath('foo/bin/bar.js');
        expect(mod.src).to.equal('foo/bin/bar.js');
        expect(mod.name).to.equal('foo.bin.bar')
      });

    });

    describe('#load', function () {

      it('won\'t request a defined module.', function (done) {
        z.module('tests.load.defined.target');
        z.env.tests.load.defined.target = 'target';
        z.loader.load('tests.load.defined.target', function (err) {
          expect(z.env.tests.load.defined.target).to.equal('target');
          done();
        })
      });

      it('loads an external script', function (done) {
        z.loader.load('fixtures.Single', function (err) {
          expect(z.env.fixtures.Single).to.equal('one');
          done();
        });
      });

      it('loads many external scripts', function (done) {
        z.loader.load('fixtures.main', function () {
          var stress = z.imports('fixtures.stress');
          expect(stress.one.One).to.be.equal('one');
          expect(stress.one.Foo).to.be.equal('Foo');
          expect(stress.two.Two).to.be.equal('two');
          expect(stress.three.Three).to.be.equal('three');
          done();
        })
      });

      it('catches syntax errors', function (done) {
        var mochaHandler = window.onerror;

        window.onerror = function (errorMsg, url, lineNumber) {
          expect(errorMsg).to.have.string('Evaluating [fixtures.errors.syntax] on line ' + lineNumber);
          window.onerror = mochaHandler;
          done();
          return true;
        };

        z.loader.load('fixtures.errors.syntax');
      });

    });

  });

	describe('#config', function () {

    it('sets an item', function () {
      z.config('foo', 'bar');
      expect(z.config('foo')).to.be.equal('bar');
    });

    it('sets several objects at a time', function () {
      z.config({
        bar: 'bin',
        baz: 'baz'
      });
      expect(z.config('bar')).to.be.equal('bin');
      expect(z.config('baz')).to.be.equal('baz');
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
			expect(z.loader.parseModulePath('FooBix').src).to.equal('some/path/to/file.js');
    });

    it('passes things in the "namespaces" key to z.map.namespaces', function () {
    	z.config('namespaces', {
    		'Froo': 'some/path/to/Froo'
    	});
			expect(z.loader.parseModulePath('Froo.Blix').src).to.equal('some/path/to/Froo/Blix.js');
    });

  });

	describe('#map', function () {

		it('maps a single item', function () {
			z.config('root', '');
			z.map('Item', 'MyLib.Item');
			expect(z.loader.parseModulePath('Item').src).to.equal('MyLib/Item.js');
			z.map('ItemTwo', 'MyLib/ItemTwo.js');
			expect(z.loader.parseModulePath('ItemTwo').src).to.equal('MyLib/ItemTwo.js');
		});

		it('maps namespaces', function () {
			z.config('root', '');
			z.mapNamespace('Foo.Bar', 'libs/FooBar/');
			expect(z.loader.parseModulePath('Foo.Bar.Bin').src).to.equal('libs/FooBar/Bin.js');
			expect(z.loader.parseModulePath('Foo.Bar.Bax.Bin').src).to.equal('libs/FooBar/Bax/Bin.js');
		});

	});

  describe('#start', function () {

    it('loads the main module', function (done) {
      z.start('fixtures/start/main', function () {
        expect(z.env.main.foo).to.equal('Started');
        expect(z.env.startfoo.foo).to.equal('startfoo');
        expect(z.config('root')).to.equal('fixtures/start/');
        expect(z.config('main')).to.equal('main');
        done();
      });
    });

  });

  describe('#startConfig', function () {

    it('loads a config file', function (done) {
      z.startConfig('fixtures/start-config/config', function () {
        expect(z.config('test')).to.equal('test');
        expect(z.config('root')).to.equal('fixtures/start-config/');
        expect(z.config('main')).to.equal('mainfoo');
        expect(z.env.main.foo).to.equal('Configured');
        expect(z.env.foo.bin.bar.mapped).to.equal('mapped');
        expect(z.env.startconfigfoo.foo).to.equal('startconfigfoo');
        done();
      });
    });

  }); 

});