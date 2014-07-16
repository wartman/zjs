// Start a script by loading a main file. Please note that,
// due to the way zjs loads scripts, z.config won't work
// if you place it in your main module. Use `z.start.config`
// if your app needs configuration. However, zjs will try
// to parse the root path from the main module, which
// often is all you need.
z.start = function (mainFile, done) {
  var lastSegment = (mainFile.lastIndexOf('/') + 1);
  var root = mainFile.substring(0, lastSegment);
  var main = mainFile.substring(lastSegment);
  z.config('root', root);
  z.config('main', main);
  z.loader.load(main, done);
};

// Start a script by loading a config file. At the very
// minimum, you'll need the following:

//    z.config({
//      root: 'scripts/'
//      main: 'app.main'
//      // You can also map modules and namespaces
//      // here, if you need to.
//      maps: {
//        modules: {
//          'foo' : 'libs/foo/foo.js'
//        }
//      }
//    });

// By convention, this file is nammed 'config.js', but you can
// call it whatever you'd like.
z.startConfig = function (configFile, done) {
  configFile = configFile + '.js';
  z.loader.getScript(configFile, function () {
    if (z.config('main'))
      z.loader.load(z.config('main'), done);
  });
};

// If this script tag has 'data-main' or 'data-config' attribues, we can
// autostart without the need to explicitly call 'z.start'.
function _autostart() {
  var scripts = document.getElementsByTagName( 'script' );
  var script = scripts[ scripts.length - 1 ];
  if (script) {
    var main = script.getAttribute('data-main');
    var config = script.getAttribute('data-config');
    if (main) {
      z.start(main);
    } else if (config) {
      z.start.config(config);
    }
  }
};

if (typeof document !== 'undefined')
  _autostart();

}));