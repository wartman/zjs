imports('fud.foob', 'foob').

exports(function(__){
  
  var bin = 'bin' + __.foob;

  return {
    bin: bin
  };

});