describe('z', function () {
   
  describe('#constructor', function () {

    it('returns an instance when called', function () {
      expect(z()).to.be.an.instanceOf(z);
    });

    it('registers a namespace', function () {
      z('tests.zConstructor.registers');
      expect(z.env.namespaces['tests.zConstructor']).to.be.true;
    });

    it('registers a module', function () {
      z('tests.zConstructor.module');
      expect(z.env.modules['tests.zConstructor.module']).to.be.an.instanceOf(z);
    });

    it('defines a global object', function () {
      z('tests.zConstructor.actual');
      expect(tests.zConstructor.actual).to.be.an('object');
    });

    it('uses a factory', function (done) {
      z('tests.zConstructor.factory', function () {
        return {foo:'bar'}
      }).done(function () {
        expect(tests.zConstructor.factory.foo).to.be.equal('bar');
        done();
      });
    });

    describe('factory flavors', function () {

      it('creates modules using chaining', function (done) {
        z('tests.flavors.chaining')
          .exports('foo', 'foo')
          .done(function () {
            expect(tests.flavors.chaining.foo).to.be.equal('foo');
            done();
          });
      });

      it('creates modules using single-export', function (done) {
        z('tests.flavors.singleExport', function () {
          return {foo: 'foo'};
        }).done(function () {
          expect(tests.flavors.singleExport.foo).to.be.equal('foo');
          done();
        });
      });

      it('creates modules using module-context', function (done) {
        z('tests.flavors.moduleContext', function (module) {
          module.exports('foo', 'foo');
          module.done(function () {
            expect(tests.flavors.moduleContext.foo).to.be.equal('foo');
            done();
          });
        });
      });

      it('creates a module using imports-exports', function (done) {
        z('tests.flavors.importsExports', function (imports, exports) {
          exports('foo', 'foo');
        }).done(function () {
          expect(tests.flavors.importsExports.foo).to.be.equal('foo');
          done();
        })
      });

      it('creates a module using defines-imports-exports', function (done) {
        z(function (defines, imports, exports) {
          defines('tests.flavors.definesImportsExports')
          exports('foo', 'foo');
        }).done(function () {
          expect(tests.flavors.definesImportsExports.foo).to.be.equal('foo');
          done();
        })
      });

    });

  });

  describe('#config', function () {

    it('sets an item', function () {
      z.config('foo', 'bar');
      expect(z.settings.foo).to.be.equal('bar');
    });

    it('sets several objects at a time', function () {
      z.config({
        bar: 'bin',
        baz: 'baz'
      });
      expect(z.settings.bar).to.be.equal('bin');
      expect(z.settings.baz).to.be.equal('baz');
    });

    it('gets a value, or returns false if undefined', function () {
      z.config('foo', 'bar');
      expect(z.config('foo')).to.be.equal('bar');
      expect(z.config('frazzle')).to.be.false;
      z.config('notFalse', '');
      expect(z.config('notFalse')).to.not.be.false;
    })

  });

  describe('#getMappedPath', function () {

    // to do

  });

  describe('#map', function () {

    it('maps several namespaces to a file', function () {
      z.map('fixtures/map/mapped.js', [
        'foo.mapped'
      ]);

      expect(z.getMappedPath('foo.mapped')).to.be.equal('fixtures/map/mapped.js');

      z.map('fixtures/fake/module.js', [
        'foo.fake',
        'foo.fake.*',
        'foo.**.many',
        'foo.*.one'
      ]);

      expect(z.getMappedPath('foo.fake')).to.be.equal('fixtures/fake/module.js');
      expect(z.getMappedPath('foo.fake.Bar')).to.be.equal('fixtures/fake/module.js');
      expect(z.getMappedPath('foo.fake.Baz')).to.be.equal('fixtures/fake/module.js');
      expect(z.getMappedPath('foo.fake.Foo')).to.be.equal('fixtures/fake/module.js');

      expect(z.getMappedPath('foo.things.many')).to.be.equal('fixtures/fake/module.js');
      expect(z.getMappedPath('foo.things.etc.many')).to.be.equal('fixtures/fake/module.js');
      expect(z.getMappedPath('foo.things.etc.fud')).to.not.be.equal('fixtures/fake/module.js');

      expect(z.getMappedPath('foo.things.one')).to.be.equal('fixtures/fake/module.js');
      expect(z.getMappedPath('foo.things.etc.one')).to.not.be.equal('fixtures/fake/module.js');
    });

    it('maps components in path to matching ones in namespace', function () {
      z.map('fixtures/fake/*.js', [
        'fid.*'
      ]);
      expect(z.getMappedPath('fid.bin')).to.be.equal('fixtures/fake/bin.js');
      expect(z.getMappedPath('fid.bin.bar')).to.not.be.equal('fixtures/fake/bin/bar.js');
      z.map('fixtures/fake/many/**/*.js', [
        'fid.**.*'
      ]);
      expect(z.getMappedPath('fid.bin.bar')).to.be.equal('fixtures/fake/many/bin/bar.js');
      expect(z.getMappedPath('fid.bin.baz.bar')).to.be.equal('fixtures/fake/many/bin/baz/bar.js');
    });

  });

  describe('#ensureNamespace', function () {
    it('registers namespaces', function () {
      z.ensureNamespace('main');
      expect(z.env.namespaces['main']).to.be.an('undefined');
      z.ensureNamespace('tests.namespaces');
      expect(z.env.namespaces['tests']).to.be.true;
      expect(z.env.namespaces['tests.namespaces']).to.be.an('undefined');
      z.ensureNamespace('tests.sub.namespaces');
      expect(z.env.namespaces['tests.sub']).to.be.true;
      expect(z.env.namespaces['tests.sub.namespaces']).to.be.an('undefined');
    });
  });

  describe('#namespaceExists', function () {
    it('checks for namespaces', function () {
      z.ensureNamespace('tests.namespaceExists');
      expect(z.namespaceExists('tests')).to.be.true;
      expect(z.namespaceExists('tests.namespaceExists')).to.be.false;
      z.ensureNamespace('tests.namespaceExists.ban');
      expect(z.namespaceExists('tests.namespaceExists')).to.be.true;
      expect(z.namespaceExists('tests.namespaceExists.ban')).to.be.false;
    });
  });

  describe('#prototype', function () {

    describe('#imports', function () {

      it('imports a dependency', function (done) {
        z('tests.proto.dep.one', function (module) {
          module.exports('foo', 'foo');
        });
        z('tests.proto.imports', function (module) {
          module.imports('tests.proto.dep.one');
          module.exports(function () {
            expect(tests.proto.dep.one).to.deep.equal({foo:'foo'});
            done();
          });
        });
      });

    });

    describe('#exports', function () {

      it('exports nammed components', function (done) {
        z('tests.proto.exports', function (module) {
          module.exports('str', 'str');
          module.exports('int', 1);
          module.exports('func', function () {
            return function () { return "func"; };
          });
        }).done(function () {
          var exp = tests.proto.exports;
          expect(exp.str).to.be.a('string')
            .and.to.equal('str');
          expect(exp.int).to.be.a('number')
            .and.to.equal(1);
          expect(exp.func).to.be.a('function');
          expect(exp.func()).to.equal('func');
          done();
        });
      });

      it('defines root', function (done) {
        z('tests.proto.exportsRoot', function (module) {
          module.exports('one', 'one');
          module.exports('two', 'two');
          module.exports(function () {
            return function () {
              return tests.proto.exportsRoot.one + tests.proto.exportsRoot.two;
            };
          });
        }).done(function () {
          var exp = tests.proto.exportsRoot;
          expect(exp.one).to.be.a('string')
            .and.to.equal('one');
          expect(exp.two).to.be.a('string')
            .and.to.equal('two');
          expect(exp).to.be.a('function');
          expect(exp()).to.equal('onetwo');
          done();
        });
      });

    });

  });

});