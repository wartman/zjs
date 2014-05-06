z('fixtures.shim.needsShim', function (module) {
  module.imports('hasDeps');
  module.exports(function () {
    return function () {
      return z.global._ + ', ' + z.global.$;
    };
  });
});