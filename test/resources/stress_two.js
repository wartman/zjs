/**
 * Stress test imports.
 */

z(function(imports, exports){

  imports('resources.target_four','*');
  imports('resources.target_five', '*');
  imports('resources.target_six', '*');
  imports('resources.text.stress_two', '*', {type:'ajax', ext:'txt'});
  imports('resources.text.stress_three', '*', {type:'ajax', ext:'txt'});

  exports(function(__){
    return {
      stress: __.target_four.target + '|' + __.target_five.target + '|' + __.target_six.target,
      stressTxt: __.stress_two + '|' + __.stress_three
    };
  });

});