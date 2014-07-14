/*!
 * This is an example of a license header.
 */

z.config({
  root: 'tests/',
  main: 'app.main'
});

z.map('foo.mapped', 'fixtures/map/mapped.js');

z('app.main', function () {

	z.imports('fixtures.stress.one');
	z.imports('fixtures.stress.two');
	z.imports('fixtures.stress.three');
	z.imports('foo.mapped');

});