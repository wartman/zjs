/*!
 * This is an example of a license header.
 */

z.config({
  root: 'tests/',
  main: 'app.main'
});

z.map('foo.mapped', 'fixtures/map/mapped.js');

z('app.main', function () {

	z.imports(
    'fixtures.stress.one',
    'fixtures.stress.two',
    'fixtures.stress.three',
    'foo.mapped'
  );

});