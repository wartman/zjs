(function(){
  
  module('z module');

  test('Module alias', function(){

    var TestModule = new z.Module();

    TestModule.imports('foo.app.bar');

    deepEqual(TestModule._deps[0], {
      from: 'foo.app.bar',
      alias: 'bar',
      uses: false,
      options: {
        type: 'script'
      }
    }, 'Parsed dep object correctly.');

    TestModule.imports('foo');

    deepEqual(TestModule._deps[1], {
      from: 'foo',
      alias: 'foo',
      uses: false,
      options: {
        type: 'script'
      }
    }, 'Parsed dep object correctly if no dots.');

  });

  test('Module user-defined alias', function(){

    var TestModule = new z.Module();

    TestModule.imports('foo.app.bar @baz');

    deepEqual(TestModule._deps[0], {
      from: 'foo.app.bar',
      alias: 'baz',
      uses: false,
      options: {
        type: 'script'
      }
    }, 'Parsed dep object correctly.');

  });

  test('Module type', function(){

    var TestModule = new z.Module();

    TestModule.imports('ajax!foo.app.bar');

    deepEqual(TestModule._deps[0], {
      from: 'foo.app.bar',
      alias: 'bar',
      uses: false,
      options: {
        type: 'ajax'
      }
    }, 'Parsed dep object correctly.');

  })

})();