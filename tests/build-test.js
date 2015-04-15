var Build = require('../lib/build');

// Should be replaced with an actual test :P.
// Does work tho. (run with `$ node ./tests/build-test/.js`)
Build({
  src: __dirname,
  dest: __dirname + '/fixtures/',
  compiledName: 'stress-build',
  main: 'fixtures.stress',
  minimalZjsBuld: true
}).compile();
