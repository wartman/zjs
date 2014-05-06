describe('Actual Module', function () {
  
  it('imports a single dep', function (done) {
    z('tests.module.single', function (module) {
      module.imports('fixtures.stress.single');
      module.exports(function(){
        expect(fixtures.stress.single.Foo).to.be.equal('Foo');
        done();
      });
    });
  });
  
  it('imports many deps recursively', function (done) {
    z('tests.module.stress', function (module) {
      module.imports('fixtures.stress.one');
      module.imports('fixtures.stress.two');
      module.imports('fixtures.stress.three');
      module.exports(function(){
        var stress = fixtures.stress;
        expect(stress.one.One).to.be.equal('one');
        expect(stress.one.Foo).to.be.equal('Foo');
        expect(stress.two.Two).to.be.equal('two');
        expect(stress.three.Three).to.be.equal('three');
        done();
      });
    });
  });

  it('imports mapped modules', function (done) {
    z.map('fixtures/map/mapped.js', ['foo.*']);
    z('tests.module.mapped', function (module) {
      module.imports('foo.mapped');
      module.exports(function () {
        expect(foo.mapped).to.equal('mapped');
        done();
      })
    });
  });

});