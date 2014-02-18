(function(z, undefined){

  module("Promise Test");

  test("Promise then", function(){

    stop();
    var promise = new z.Promise(function(res, rej){
      res(0);
      rej("Failed");
    });

    promise.then(function(i){
      return i += 1;
    })
    .then(function(i){
      return i += 1;
    })
    .then(function(i){
      start();
      equal(i, 2, "Then ran");
    });

  });

  test("Promise catches", function(){

    stop();
    var promise = new z.Promise(function(res, rej){
      rej('fail');
    });

    promise.then(function(v){
      return v+=1;
    })
    .catches(function(reason){
      start();
      equal(reason, 'fail', 'Failed');
    });

  });

  test("Pass promise handler to another promise", function(){

    var defer = new z.Deffered()
      , promise = defer.promise()
      , deferTwo = new z.Deffered()
      , promiseTwo = deferTwo.promise();

    stop();

    promise.then(function(i){
      i += 1;
      equal(i, 2, 'Handled by other resolver');
      return i;
    })
    .catches(function(e){
      ok(false, 'Something went wrong');
    });

    promiseTwo.then(function(i){
      i +=1;
      console.log(i);
      return i;
    })
    .done(function(i){
      start();
      equal(i, 2, 'Resolver passed');
    });

    // Let the other promise handle this Deffered's resolution.
    defer.resolve(promiseTwo);

    // Resolve both promises with the same value.
    deferTwo.resolve(1);

  });

})(window.z || {});