z('app.foo', function (done) {

  z.imports(
    'app.bin',
    'app.ban'
  );
  var $ = z.imports('lib.jQuery');

  $.getJSON('file', function(json, textStatus) {
    app.foo = json;
    done();
  });

});