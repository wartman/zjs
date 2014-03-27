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


    z.setup({
      root: ''
    });

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

  test('shim', function(){

    var mockReq = {
        from: 'jquery',
        options: {}
      }
      , mockLoader = {options:{ext:'js'}}

    z.setup({
      root: 'scripts/',
      shim: {
        'jquery': {
          src: 'bower_components/jquery-2.1.0.min',
          exports: '$'
        },
        'plugin': function(req){
          req.src = z.config.root + 'bower_components/plugins.js';
          return req;
        }
      }
    });

    actual = z.filter('shim')(mockReq, mockLoader);

    equal('scripts/bower_components/jquery-2.1.0.min.js', actual.src, 'Parsed correctly.');

    mockReq = {
      from: 'plugin',
      options: {}
    };

    actual = z.filter('shim')(mockReq, mockLoader);
    equal('scripts/bower_components/plugins.js', actual.src, 'Parsed callback correctly.');



  });

})();