imports({from:'fud.foob', uses:['foob'] }).

exports(function(__){
  
  var bin = 'bin' + __.foob;

  return {
    bin: bin
  };

});