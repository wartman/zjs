describe('z', function () {

  beforeEach(function () {
    z.config('root', '');
    z.config('debug', true);
  })

  describe('#module', function () {

    it('defines a new namespace', function () {
      var mod = z.module('tests.module');
      var modules = z.getModules();
      var namespaces = z.getNamespaces();
      expect(modules.tests).to.not.be.an('undefined');
      expect(modules.tests.module).to.be.an('object');
      expect(namespaces.tests).to.be.true;
      expect(mod).to.be.an('object');
      mod.foo = 'foo';
      expect(modules.tests.module.foo).to.equal('foo');
    });

  });

  describe('#namespace', function () {

    it('ensures a namespace exists', function () {
      z.namespace('testsfoo');
      var namespaces = z.getNamespaces();
      var modules = z.getModules();
      expect(namespaces.testsfoo).to.be.true;
      expect(modules.testsfoo).to.be.an('object');
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

  describe('#plugin', function () {

    it('registers a plugin', function (done) {
      z.plugin('tests.plugin', {
        handler: function (mod, next) {
          var test = z.module(mod.name);
          test.foo = 'foo';
          next();
        }
      });
      z.usePlugin('tests.plugin', function(plugin) {
        plugin.handler({name:'tests.plugins.target'}, function () {
          var modules = z.getModules();
          expect(modules.tests.plugins.target.foo).to.equal('foo');
          done();
        });
      });
    });

  });

  describe('#usePlugin', function () {

    it('loads an external plugin', function (done) {
      z.usePlugin('fixtures.plugins.test', function(plugin) {
        plugin.handler({name:'tests.external.plugins.target'}, function () {
          var modules = z.getModules();
          expect(modules.tests.external.plugins.target.foo).to.equal('foo');
          done();
        });
      });
    })

  });

  describe('#Parser', function () {
    
    describe('#getDeps', function () {

      it('detects imports', function () {
        var mock = function () {
          z.imports(
            'foo.bar',
            'foo.bin',

            'foo.bax'
          );
        };
        var parser = new z.Parser(mock.toString());
        var deps = parser.getDeps();
        expect(deps).to.deep.equal([
          'foo.bar',
          'foo.bin',
          'foo.bax'
        ]);
      });

    });

  });

  describe('#Loader', function () {

    describe('#parseModulePath', function () {

      it('parses into name and src', function () {
        var loader = z.Loader.getInstance();
        var mod = loader.parseModulePath('foo.bin.bar');
        expect(mod.src).to.equal('foo/bin/bar.js');
        expect(mod.name).to.equal('foo.bin.bar');
        var mod = loader.parseModulePath('foo/bin/bar.js');
        expect(mod.src).to.equal('foo/bin/bar.js');
        expect(mod.name).to.equal('foo.bin.bar')
      });

    });

    describe('#load', function () {

      it('won\'t request a defined module.', function (done) {
        var loader = z.Loader.getInstance();
        z.module('tests.load.defined.target');
        z.getModules().tests.load.defined.target = 'target';
        loader.load('tests.load.defined.target', function (err) {
          var modules = z.getModules();
          expect(modules.tests.load.defined.target).to.equal('target');
          done();
        })
      });

      it('loads an external script', function (done) {
        var loader = z.Loader.getInstance();
        loader.load('fixtures.Single', function (err) {
          var modules = z.getModules();
          expect(modules.fixtures.Single).to.equal('one');
          done();
        });
      });

      it('loads many external scripts', function (done) {
        var loader = z.Loader.getInstance();
        loader.load('fixtures.main', function () {
          var stress = z.imports('fixtures.stress');
          expect(stress.one.One).to.be.equal('one');
          expect(stress.one.Foo).to.be.equal('Foo');
          expect(stress.two.Two).to.be.equal('two');
          expect(stress.three.Three).to.be.equal('three');
          done();
        })
      });

      it('loads using the txt plugin', function (done) {
        var loader = z.Loader.getInstance();
        loader.load('txt:fixtures/file/txt.txt', function (err) {
          if (err) throw err;
          var modules = z.getModules();
          expect(modules.fixtures.file.txt).to.equal('loaded');
          done();
        });
      });

      it('loads using the shim plugin', function (done) {
        var loader = z.Loader.getInstance();
        loader.load('shim:fixtures.global', function () {
          expect(window.globalItem).to.equal('globalItem');
          done();
        });
      });

      it('loads using a mapped shim', function (done) {
        var loader = z.Loader.getInstance();
        z.map('globalMapped', 'shim:fixtures/globalMapped.js');
        loader.load('globalMapped', function () {
          expect(window.globalMapped).to.equal('globalMapped');
          done();
        });
      });

      it('catches syntax errors', function (done) {
        var mochaHandler = window.onerror;
        var loader = z.Loader.getInstance();

        window.onerror = function (errorMsg, url, lineNumber) {
          expect(errorMsg).to.have.string('Evaluating [fixtures.errors.syntax] on line ' + lineNumber);
          window.onerror = mochaHandler;
          done();
          return true;
        };

        loader.load('fixtures.errors.syntax');
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
      var loader = z.Loader.getInstance();
    	z.config('map', {
        modules: {
    		  'FooBix': 'some/path/to/file.js'
        }
    	});
			expect(loader.parseModulePath('FooBix').src).to.equal('some/path/to/file.js');
    });

    it('passes things in the "namespaces" key to z.map.namespaces', function () {
      var loader = z.Loader.getInstance();
    	z.config('map', {
        namespaces: {
    		  'Froo': 'some/path/to/Froo'
        }
    	});
			expect(loader.parseModulePath('Froo.Blix').src).to.equal('some/path/to/Froo/Blix.js');
    });

  });

	describe('#map', function () {

		it('maps a single item', function () {
      var loader = z.Loader.getInstance();
			z.config('root', '');
			z.map('Item', 'MyLib.Item');
			expect(loader.parseModulePath('Item').src).to.equal('MyLib/Item.js');
			z.map('ItemTwo', 'MyLib/ItemTwo.js');
			expect(loader.parseModulePath('ItemTwo').src).to.equal('MyLib/ItemTwo.js');
		});

    it('maps plugins', function () {
      var loader = z.Loader.getInstance();
      z.map('mappedPlugin', 'fakePlugin:foo.bin.bar');
      var path = loader.parseModulePath('mappedPlugin');
      expect(path.plugin).to.equal('fakePlugin');
      expect(path.src).to.equal('foo/bin/bar.js');
    });

		it('maps namespaces', function () {
      var loader = z.Loader.getInstance();
			z.config('root', '');
			z.mapNamespace('Foo.Bar', 'libs/FooBar/');
			expect(loader.parseModulePath('Foo.Bar.Bin').src).to.equal('libs/FooBar/Bin.js');
			expect(loader.parseModulePath('Foo.Bar.Bax.Bin').src).to.equal('libs/FooBar/Bax/Bin.js');
		});

    it('maps namespaced plugins', function () {
      var loader = z.Loader.getInstance();
      z.mapNamespace('foo.plugins', 'fakePlugin:libs/foo');
      var path = loader.parseModulePath('foo.plugins.jk');
      expect(path.plugin).to.equal('fakePlugin');
      expect(path.src).to.equal('libs/foo/jk.js');
    });

	});

  describe('#start', function () {

    it('loads the main module', function (done) {
      z.start('fixtures/start/main', function () {
        var modules = z.getModules();
        expect(modules.main.foo).to.equal('Started');
        expect(modules.startfoo.foo).to.equal('startfoo');
        expect(z.config('root')).to.equal('fixtures/start/');
        expect(z.config('main')).to.equal('main');
        done();
      });
    });

  });

  describe('#startConfig', function () {

    it('loads a config file', function (done) {
      z.startConfig('fixtures/start-config/config', function () {
        var modules = z.getModules();
        expect(z.config('test')).to.equal('test');
        expect(z.config('root')).to.equal('fixtures/start-config/');
        expect(z.config('main')).to.equal('mainfoo');
        expect(modules.mainfoo.foo).to.equal('Configured');
        expect(modules.foo.bin.bar.mapped).to.equal('mapped');
        expect(modules.startconfigfoo.foo).to.equal('startconfigfoo');
        done();
      });
    });

  }); 

});