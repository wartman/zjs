describe('Shimmed Imports', function () {

  beforeEach(function () {
    z.config('root', '')
  });

  describe('Shim with no dependency', function () {

    it('imports a shimed script', function (done) {
      z.shim('noDeps', {
        map: 'fixtures/shim/no-deps.js',
        imports: false
      });
      z('tests.shim.noDeps', function (module) {
        module.imports('noDeps');
        module.exports(function () {
          expect(noDeps).to.not.be.an('undefined');
          expect(noDeps).to.be.equal('noDeps');
          done();
        });
      });
    });

  });

  describe('Shim with dependencies', function () {

    it('ensures that all dependencies are available for the shim', function (done) {
      z.shim('_', {
        map: 'fixtures/shim/fakeUnderscore.js'
      });
      z.shim('$', {
        map: 'fixtures/shim/fakeJquery.js'
      });
      z.shim('hasDeps', {
        map: 'fixtures/shim/has-deps.js',
        imports: ['$', '_']
      });
      z('tests.shim.hasDeps', function (module) {
        module.imports('hasDeps');
        module.exports(function () {
          expect(hasDeps._).to.not.be.an('undefined');
          expect(hasDeps.$).to.not.be.an('undefined');
          expect(hasDeps._).to.be.equal('underscore');
          expect(hasDeps.$).to.be.equal('jquery');
          done();
        });
      });
    });

    it('can depend on zjs modules', function (done) {
      z.shim('hasZjsDeps', {
        map: 'fixtures/shim/has-zjs-deps.js',
        imports: ['fixtures.shim.zjsDepOne', 'fixtures.shim.zjsDepTwo']
      });
      z('tests.shim.hasZjsDeps', function (module) {
        module.imports('hasZjsDeps');
        module.exports(function () {
          expect(fixtures.shim.zjsDepOne.foo).to.be.equal('foo');
          expect(fixtures.shim.zjsDepTwo.foo).to.be.equal('foo');
          expect(hasZjsDeps.foos).to.be.equal('foofoo');
          done();
        });
      });
    });

  });

});