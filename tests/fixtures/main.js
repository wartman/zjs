/*!
 * This is an example of a license header.
 */

z.config({
  root: 'tests/',
  main: 'fixtures.main'
});

// z.map('foo.mapped', 'fixtures/map/mapped.js');

z.module('fixtures.main');

z.imports(
  'fixtures.stress.one',
  'fixtures.stress.two',
  'fixtures.stress.three'
);

fixtures.main.run = function () {
  console.dir(fixtures);
};