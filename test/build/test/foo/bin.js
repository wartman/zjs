z('foo.bin').
imports('foo.bax').
exports(function(){
  this.Bax = foo.bax;
  this.Bin = "Bin";
});