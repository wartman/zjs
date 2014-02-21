/**
 * Stress test imports.
 */
var Stress = z()
  .imports('resources.target_one', '*')
  .imports('resources.target_two', '*')
  .imports('resources.target_three', '*')
  .imports('resources.text.stress_one', '*', {type:'ajax', ext:'txt'});

Stress.exports(function(__){
  return {
    stress: __.target_one.target + '|' + __.target_two.target + '|' + __.target_three.target,
    stressTxt: __.stress_one
  };
});