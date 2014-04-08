z.config('root', 'test/');
z.config('main', 'app.main');

z('app.main').
imports('fixtures.stress.one').
imports('fixtures.stress.two').
imports('fixtures.stress.three').
imports('txt!fixtures.file.txt').
exports(function(){
  this.exports = "the main file";
});