z.plugin('fixtures.plugins.test', {
  handler: function (mod, next) {
    var test = z.module(mod.name);
    test.foo = 'foo';
    next();
  }
});