(function(){
  
  module('z Ajax');

  var fail = function(e){
    start();
    ok(false);
  }
  
  test('Load a txt file', function(){

    stop();

    new z.Ajax({
      method: 'GET',
      src: 'resources/text/file.txt'
    }).done(function(data){
      start();
      equal(data, 'Was fetched.', 'File loaded');
    }, fail);

  });

  test('Load a txt file API', function(){

    stop();

    z.ajax({
      method: 'GET',
      src: 'resources/text/file.txt'
    }, function(data){
      start();
      equal(data, 'Was fetched.', 'File loaded');
    }, fail);

  });

})();