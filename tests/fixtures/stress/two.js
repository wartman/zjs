z.module(
  'fixtures.stress.two'
).imports(
  'fixtures.stress.three'
).define(function () {
  fixtures.stress.two = 'two';
});
