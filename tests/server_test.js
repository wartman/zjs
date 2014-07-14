var expect = require('chai').expect;
require('../src/build');
var grunt = require('grunt');

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

describe('z.Build', function () {

  beforeEach(function () {
    z.env = {
      namespaces: {},
      modules: {},
      plugins: {},
      maps: {
        items: {},
        namespaces: {}
      }
    };
    z.config('root', '')
  });

  it('compiles modules', function (done) {
    var build = z.Build({
      main: 'tests/fixtures/main.js',
      dest: 'tests/tmp/app.js'
    });
    build.done(function () {
      var actual = grunt.file.read(__dirname + "/tmp/app.js");
      var root = {};
      var module = Function('', actual);

      // Load the compiled module and make sure everything
      // is defined as expected, and all deps are sorted
      // correctly.
      module.call(global);

      var stress = global.fixtures.stress;

      expect(stress.one.One).to.equal('one');
      expect(stress.one.Foo).to.equal('Foo');
      expect(stress.two.Two).to.equal('two');
      expect(stress.three.Three).to.equal('three');

      done();
    });
  });

});