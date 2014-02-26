(function(){
  
  module('z Script', {
    setup: function() {
      // setup for z Script 
    },
    teardown: function() {
      //teardown for z Script
    }
  });

  test('Load a script', function(){

    stop();

    new z.Script({
      src: 'resources/script/load.js'
    }).done(function(){
      start();
      ok(window.loaded, 'Script was loaded.');
    }, function(){
      start();
      ok(false, 'Something went wrong.');
    });

  });

  test('Load a script with API', function(){
    stop();

    z.script({src: 'resources/script/loadAPI.js'}, function(){
      start();
      ok(window.apiLoaded, 'Script was loaded');
    }, function(){
      start();
      ok(false, 'Something went wrong');
    })
  })

})();