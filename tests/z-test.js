describe('z', function () {
  
  describe('#module', function () {

    it('creates a new module', function (done) {
      z.module('tests.module.create').define(function () {
        expect(tests.module.create).to.be.an('object');
        done();
      });
    });

    it('imports existing modules', function (done) {
      z.module(
        'tests.module.importable.target'
      ).define(function () {
        tests.module.importable.target.foo = 'foo';
      });
      z.module(
        'tests.module.importable.parent'
      ).imports(
        'tests.module.importable.target'
      ).define(function () {
        expect(tests.module.importable.target.foo).to.equal('foo');
        done();
      });
    });

    describe('#package', function () {

      it('provides a package namespace that the module can add to', function () {
        z.module(
          'tests.module.packaged.item'
        ).package(
          'item'
        ).define(function () {
          expect(item).to.be.an('object');
        });
      })

    })

  });

  describe('#loadModules', function () {

    it('loads modules', function (done) {
      z.loadModules(['fixtures.simple'], function (err) {
        if (err) return done(err);
        expect(fixtures.simple.foo).to.equal('foo');
        done();
      });
    });

    it('loads modules recursively', function (done) {
      z.loadModules(['fixtures.stress'], function (err) {
        if (err) return done(err);
        expect(fixtures.stress.one).to.equal('one');
        expect(fixtures.stress.two).to.equal('two');
        expect(fixtures.stress.three).to.equal('three');
        done();
      });
    });

    it('loads modules defined using the `module` shortcut (no `z.`)', function (done) {
      z.loadModules(['fixtures.shortcut'], function (err) {
        if (err) return done(err);
        expect(fixtures.shortcut.foo).to.equal('foo');
        done();
      });
    });

    it('loads modules even if module name is different', function (done) {
      z.loadModules(['fixtures.packaged.thing'], function (err) {
        if (err) return done(err);
        expect(packaged.thing).to.equal('packaged');
        done();
      });
    })

  });

});