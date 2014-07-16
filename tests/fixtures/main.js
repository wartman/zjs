/*!
 * This is an example of a license header.
 */

z.module('fixtures.main');

z.imports(
  'fixtures.stress.one',
  'fixtures.stress.two',
  'fixtures.stress.three'
);

fixtures.main.run = function () {
  console.dir(fixtures);
};