/**
 * Stress test imports.
 */
imports({from:'tests.resources.module.target_one', uses:'*'}).
imports({from:'tests.resources.module.target_two', uses:'*'}).
imports({from:'tests.resources.module.target_three', uses:'*'}).
imports({from:'tests.resources.text.stress_one', as:'file', type:'txt' }).

exports(function(__){
  return {
    stress: __.target_one.target + '|' + __.target_two.target + '|' + __.target_three.target,
    stressTxt: __.stress_one
  };
});