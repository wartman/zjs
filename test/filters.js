(function(){

  module('z filters');

  test('alias', function(){

    z.setup({
      alias: {
        'bar.foo': 'bar'
      }
    });

    var actual = z.filter('alias')({
      from:'bar.foo.bin'
    });

    equal('bar.bin', actual.fromAlias, 'Filtered');

  });

  test('src', function(){

    var mockReq = {
      from: 'fin.bin',
      options: {}
    }

    var mockLoader = {options:{ext:'js'}}
      , src = z.filter('src');

    var actual = src(mockReq, mockLoader);

    equal('fin/bin.js', actual.src, 'Parsed correctly.');

    z.setup({
      root: 'scripts/',
      alias: {
        'fin': 'lib',
      }
    });

    var mockReq = {
      from: 'fin.bin',
      options: {}
    }
    actual = z.filter('alias')(mockReq, mockLoader);
    actual = z.filter('src')(actual, mockLoader);

    equal('scripts/lib/bin.js', actual.src, 'Parsed correctly.');

  });

})();