/**
 * Stress test imports.
 */
imports({from:'tests.resources.module.target_four', uses:'*'}).
imports({from:'tests.resources.module.target_five', uses:'*'}).
imports({from:'tests.resources.module.target_six', uses:'*'}).
imports({from:'tests.resources.text.stress_two', as:'file', type:'txt' }).
imports({from:'tests.resources.text.stress_three', as:'file', type:'txt' }).

exports(function(__){
  return {
    stress: __.target_four.target + '|' + __.target_five.target + '|' + __.target_six.target,
    stressTxt: __.stress_two + '|' + __.stress_three
  };
});