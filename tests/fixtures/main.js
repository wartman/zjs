/*!
 * This is an example of a license header.
 */

z.config({
  root: 'tests/',
  main: 'app.main',
  shim: {
    'shim': {
      map: 'fixtures/shim/no-deps.js',
      imports: false
    }
  },
  map: {
    'fixtures/map/mapped.js': ['foo.*']
  }
});

z('app.main', function (imports, exports) {
  imports('fixtures.stress.one');
  imports('fixtures.stress.two');
  imports('fixtures.stress.three');
  imports('foo.mapped');
  imports('txt!fixtures/file/txt.txt');
  imports('shim');
  exports(function(){
    return "the main file";
  });
});