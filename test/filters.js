(function(){

  module('z filters');

  test('alias', function(){

    z.setup({
      alias: {
        'bar.foo': 'bar'
      }
    });

    var actual = z.filter('all').alias({
      from:'bar.foo.bin'
    });

    equal(actual.fromAlias, 'bar.bin', 'Filtered');

  });

  test('src', function(){

    var mockReq = {
      from: 'fin.bin',
      options: {}
    }

    z.setup({
      root: ''
    });

    var actual = z.filter('all').src(mockReq);

    equal(actual.src, 'fin/bin.js', 'Parsed correctly.');

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
    actual = z.filter('all').alias(mockReq);
    actual = z.filter('all').src(actual);

    equal(actual.src, 'scripts/lib/bin.js', 'Parsed correctly.');

  });

  test('shim', function(){

    var mockReq = {
      from: 'jquery',
      options: {}
    };

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

    actual = z.filter('all').shim(mockReq);

    equal(actual.src, 'scripts/bower_components/jquery-2.1.0.min.js', 'Parsed correctly.');

    mockReq = {
      from: 'plugin',
      options: {}
    };

    actual = z.filter('all').shim(mockReq);
    equal(actual.src, 'scripts/bower_components/plugins.js', 'Parsed callback correctly.');

  });

  test('plugin', function(){

    var mockReq = {
      from: 'txt!file',
      options: {}
    };

    var actual = z.filter('all').plugin(mockReq);
    deepEqual(actual, {
      from: 'txt!file',
      fromAlias: 'file',
      options: {
        ext: 'txt',
        type: 'ajax'
      }
    }, 'Plugin detected');

    var mockReq = {
      from: 'json!file',
      options: {}
    };
    actual = z.filter('all').plugin(mockReq);
    deepEqual(actual, {
      from: 'json!file',
      fromAlias: 'file',
      options: {
        ext: 'json',
        type: 'ajax'
      }
    }, 'Plugin detected, correct extension applied');

    var mockReq = {
      from: 'ajax!file',
      options: {}
    };
    actual = z.filter('all').plugin(mockReq);
    deepEqual(actual, {
      from: 'ajax!file',
      fromAlias: 'file',
      options: {
        ext: 'json',
        type: 'ajax'
      }
    }, 'Plugin detected, `ajax!` defauts to a `json` extension');

    var mockReq = {
      from: 'ajax!file.txt',
      options: {}
    };
    actual = z.filter('all').plugin(mockReq);
    deepEqual(actual, {
      from: 'ajax!file.txt',
      fromAlias: 'file',
      options: {
        ext: 'txt',
        type: 'ajax'
      }
    }, 'Plugin detected, if a file extension is found in `from`, the filter will use that');

  });

  test('Plugin filter can handle new loaders', function(){

    z.loader('mock', {
      method: function(){},
      handler: function(){},
      options:{
        ext: 'mock',
        type: 'ajax'
      }
    });

    var mockReq = {
      from: 'mock!file',
      options: {}
    };
    var actual = z.filter('all').plugin(mockReq);
    deepEqual(actual, {
      from: 'mock!file',
      fromAlias: 'file',
      options: {
        ext: 'mock',
        type: 'ajax'
      }
    }, 'Used the attributes of the new loader');

  });

  test('runFilters `all`, scripts', function(){
    
    z.setup({
      root: 'scripts/',
      alias: {
        'foo.bar': 'lib.bar',
      }
    });

    var mockReq = {
      from: 'foo.bar.baz',
      uses: ['Foo', 'Bin'],
      options: {
        type: 'script'
      }
    }

    var actual = z.runFilters('all', mockReq);

    deepEqual(actual, {
      from: 'foo.bar.baz',
      fromAlias: 'lib.bar.baz',
      uses: ['Foo', 'Bin'],
      src: 'scripts/lib/bar/baz.js',
      options: {
        ext: 'js',
        type: 'script'
      }
    }, 'All filters were applied');

  })

  test('runFilters, all, ajax', function(){

    z.setup({
      root: 'scripts/',
      alias: {
        'foo.bar': 'lib.bar',
      }
    });

    var mockReq = {
      from: 'ajax!foo.bar.baz',
      options: {}
    }

    var actual = z.runFilters('all', mockReq);
    if(actual.options.type && actual.options.type === 'ajax'){
      actual = z.runFilters('ajax', actual);
    }

    deepEqual(actual, {
      from: 'ajax!foo.bar.baz',
      fromAlias: 'lib.bar.baz',
      src: 'scripts/lib/bar/baz.json',
      method: 'get',
      options: {
        type: 'ajax',
        ext: 'json',
      }
    }, 'All filters were applied');

  })

})();