(function(){
  
  module('z mini');

  test('Get a dep', function(){

    stop();

    z('moduleTest.exports').
    import('resources.exports').
    export(function(){
      start();
      equal(resources.exports.Foo, 'Foo', 'Modules imported');
    });

  });

  // test('Stress test', function(){

  //   stop();

  //   z('moduleTest.stress').
  //   import('resources.mini.stress_one').
  //   import('resources.mini.stress_two').
  //   import('resources.mini.stress_three').
  //   export(function(){

  //   });

  // });

})();