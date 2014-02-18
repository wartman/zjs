/**
 * Test z.Promise against the A+ spec.
 */

var z = require('../../dist/z.js').z;
var promisesAplusTests = require("promises-aplus-tests");

var adapter = {

  resolved: function(value){
    var defer = new z.Deffered();
    defer.resolve(value);
    return defer.promise();
  },

  rejected: function(reason){
    var defer = new z.Deffered();
    defer.reject(reason);
    return defer.promise();
  },

  deffered: function(){
    var defer = new z.Deffered();
    return {
      promise : defer.promise(),
      resolve: function(value){
        return defer.resolve(value);
      },
      reject: function(value){
        return defer.reject(value);
      } 
    };
  }

};

// Export the test runner.
module.exports = function(){
  // Run tests
  promisesAplusTests(adapter, { reporter: "spec" }, function (err) {
    console.log(err);
      // All done; output is in the console. Or check `err` for number of failures.
  });
}