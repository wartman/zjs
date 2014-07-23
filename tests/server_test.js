var expect = require('chai').expect;
require('../src/build');
var fs = require('fs');

// describe('sorter', function () {

//   it('sorts an array', function () {
//     var sorted = sorter({
//       'a' : ['b', 'c'],
//       'b' : ['c'],
//       'c' : ['d'],
//       'd' : [],
//       'f' : ['d', 'a']
//     });
//     expect(sorted).to.deep.equal(['d', 'c', 'b', 'a', 'f']);
//   });

// });

describe('z.build', function () {

  beforeEach(function () {
    z.env = {
      namespaces: {},
      modules: {}
    };
    z.config('root', '')
  });

  it('compiles modules', function (done) {
    z.build.newInstance({
      main: 'tests/fixtures/config.js',
      dest: 'tests/tmp/app.js'
    });
    z.build.done(function () {
      var actual = fs.readFileSync(__dirname + "/tmp/app.js", 'utf-8');
      var module = Function('', actual);

      // Load the compiled module and make sure everything
      // is defined as expected, and all deps are sorted
      // correctly.
      module.call(global);

      var stress = z.imports('fixtures.stress');

      expect(stress.one.One).to.equal('one');
      expect(stress.one.Foo).to.equal('Foo');
      expect(stress.two.Two).to.equal('two');
      expect(stress.three.Three).to.equal('three');

      done();
    });
  });

});