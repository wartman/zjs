var expect = require('chai').expect;
var Build = require('../src/build');
var sorter = require('../src/sorter');
var grunt = require('grunt');

describe('sorter', function () {

  it('sorts an array', function () {
    var sorted = sorter({
      'a' : ['b', 'c'],
      'b' : ['c'],
      'c' : ['d'],
      'd' : [],
      'f' : ['d', 'a']
    });
    expect(sorted).to.deep.equal(['d', 'c', 'b', 'a', 'f']);
  });

});

describe('Build', function () {

  describe('#start', function () {

    beforeEach(function () {
      z.env = {
        namespaces: {},
        modules: {},
        plugins: {},
      };
    });

    it('compiles modules', function (done) {
      var build = new Build();
      build.start(__dirname + '/fixtures/main.js', __dirname + '/fixtures/tmp/app.js');
      build.done(function () {
        var actual = grunt.file.read(__dirname + "/fixtures/tmp/app.js");
        var root = {};
        var module = Function('', actual);

        // Load the compiled module and make sure everything
        // is defined as expected, and all deps are sorted
        // correctly.
        module.call(root);

        var stress = root.fixtures.stress;

        expect(stress.one.One).to.equal('one');
        expect(stress.one.Foo).to.equal('Foo');
        expect(stress.two.Two).to.equal('two');
        expect(stress.three.Three).to.equal('three');
        expect(root.noDeps).to.equal('noDeps');
        expect(root.fixtures.file.txt).to.equal('loaded');

        done();
      });
    });

    it('compiles shimmed items correctly', function (done) {
      z.env.modules = {};
      var build = new Build();
      build.start(__dirname + '/fixtures/shimMain.js', __dirname + '/fixtures/tmp/shimApp.js');
      build.done(function (){
        var actual = grunt.file.read(__dirname + "/fixtures/tmp/shimApp.js");
        var root = {};
        var module = Function('', actual);

        module.call(root);

        expect(root.fixtures.shim.needsShim()).to.equal('underscore, jquery');
        expect(root._).to.equal('underscore');
        expect(root.$).to.equal('jquery');
        expect(root.hasDeps._).to.equal('underscore');
        expect(root.hasDeps.$).to.equal('jquery');

        done();
      });
    });

  });

});