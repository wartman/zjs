z('fixtures.plugin', function () {
  z.plugin.register('fixtures.plugin', function (req, next, error) {
    z(req, function () {
      var obj = z.sys.getObjectByName(req);
      obj.foo = 'foo';
    }).done(next, error);
  });
});