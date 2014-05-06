/*!
 * This is an example of a license header.
 */

z.config({
  root: 'tests/',
  main: 'app.main',
  shim: {
    _: {
      map: 'fixtures/shim/fakeUnderscore.js'
    },
    '$': {
      map: 'fixtures/shim/fakeJquery.js'
    },
    'hasDeps': {
      map: 'fixtures/shim/has-deps.js',
      imports: ['$', '_']
    }
  }
});

z('app.main', function (imports, exports) {
  imports('fixtures.shim.needsShim');
  imports('hasDeps');
  exports(function(){
    return "the main file";
  });
});