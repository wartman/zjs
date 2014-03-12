var Bin = z()
  .imports('fud.foob', 'foob');

Bin.exports(function(__){
  
  var bin = 'bin' + __.foob;

  return {
    bin: bin
  };

});