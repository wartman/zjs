z.module(
  'fixtures.stress'
).imports(
  'fixtures.stress.one',
  'fixtures.stress.two'
).define(function () {
  console.log('imported');
});