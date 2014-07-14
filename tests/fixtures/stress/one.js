z('fixtures.stress.one', function () {

	// Tests importing inside same namespace ('fixtures.stress', in this case):
	z.imports('.item.foo');

  fixtures.stress.one.One = "one";
  fixtures.stress.one.Foo = fixtures.stress.item.foo;

});