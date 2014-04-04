var assert = require("assert");
var Build = require('../../lib/build');

describe('run build', function(){

  describe('Compile', function(){
    it('should compile', function(done){
      Build( __dirname + '/test/main.js', __dirname + '/test/build/app.js')
        .done(function(){
          assert.equal(this._compiled, '(function(global){\n/* namespaces */\nglobal.main = {};\nglobal.foo = {};\nglobal.foo.bar = {};\n\n/* modules */\n;(function (){\n  this.Foo = \'foo\';\n}).call( global.main );\n;(function () {\n  this.Bar = "Bar";\n}).call( global.foo.bar );\n\n})(this);');
          done();
        });
      });
  });

})