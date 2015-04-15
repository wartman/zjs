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

    it('returns an error if a module does not exist', function (done) {
      z.loadModules(['fixtures.wrongName'], function (err) {
        if (!err) done(new Error('expected an error, none returned'));
        done();
      });
    });

  });

});