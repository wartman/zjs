var Bin = z()
  .imports('fud.foob', 'foob')
  .imports('fud.txt.test', '*', {type:'ajax', ext:'txt'});

Bin.exports(function(__){
  
  var bin = 'bin' + __.foob;

  return {
    bin: bin
  };

});