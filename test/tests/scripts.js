(function(z, undefined){

  module('Scripts test');

  /**
   * Remove a script so we can keep testing using it.
   */
  function removeScript(node){
    var head = document.getElementsByTagName('head')[0]
      ;

    z.Scripts.pending = [];
    head.removeChild(node);
  }

  /**
   * Simple function to catch a failure and keep testing.
   */
  function catchFail(status){
    start();
    ok(false, 'Failed to load script');
  }

  test("z.Scripts.load", function(){

    stop();

    // Will throw a 404 error in the console:
    // THIS IS EXPECTED!
    // It's supposed to fail :)
    z.Scripts.load({
      url: 'tests/resources/scripts/loaded.js',
    }, function(node){
      start();

      equal(node.getAttribute('data-from'), 'tests/resources/scripts/loaded.js', 'Node was loaded.');
      stop();
      setTimeout(function(){
        // ie9, ie10 run immediately on addition to the DOM so we need to wait a bit
        // to make sure the script is done loading.
        start();
        equal(window.loaded, true, 'Scripts ran');
        window.loaded = null;
      }, 20);

      removeScript(node);

    }, catchFail);

  });

  test("z.Scripts.isLoaded", function(){

    stop();

    z.Scripts.load({
      url: 'tests/resources/scripts/loaded.js',
    }, function(node){
      start();

      equal(z.Scripts.isLoaded('tests/resources/scripts/loaded.js'), true, 'Found loaded script');

      removeScript(node);

    }, catchFail);

  });

  test("z.Scripts.isPending", function(){

    stop();

    z.Scripts.load({
      url: 'tests/resources/scripts/loaded.js',
    }, function(node){
      start();

      console.log(z.Scripts.pending)

      equal(z.Scripts.isPending('tests/resources/scripts/loaded.js'), true, 'Script is pending');

      removeScript(node);

    }, catchFail);

  });

  test("z.Scripts.load Error", function(){

    stop();

    z.Scripts.load({
      url: 'not/a/real/script.js'
    }, function(node){
      start();

      ok(false, 'Loaded a non-existent file somehow.');

    }, function(err){
      start();

      ok(true, 'Ran the error callback.');

    });

  });

  // test("z.Scripts is thenable", function(){

  //   stop();

  //   z.Scripts.load({
  //     url: 'tests/resources/scripts/loaded.js'
  //   })
  //   .then(function(node){
  //     start();
  //     ok('Promise fulfilled');
  //     return node;
  //   })
  //   .catches(catchFail);
  // });

})(window.z || {});