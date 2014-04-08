z.config('root', 'test/');
z.config('main', 'app.main');
z.map('fixtures/map/mapped.js', [
  'foo.*'
]);

z('app.main')
  .imports('fixtures.stress.one')
  .imports('fixtures.stress.two')
  .imports('fixtures.stress.three')
  .imports('foo.mapped')
  .imports('txt!fixtures.file.txt')
  .exports(function(){
    this.exports = "the main file";
  });