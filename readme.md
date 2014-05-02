zjs
===
A lightweight module loader for browsers.

About zjs
---------
Zjs is a modular script loader and compiler for browsers. It can be compared to
more robust options like requireJs, but differs in that it loads modules based on
namespaces (which are just javascript objects, such as 'app.foo.bar'), not filepaths.
The advantage of this is that a project can be compiled into a single file without
needing any extra code (such as 'require' wrappers); in fact, a compiled zjs project
won't have a single line of code from the zjs library.

If you need lots of AMD stuff on your projects, zjs is likely not the way to go. However,
it might be ideal for smaller apps. If you need to use popular libraries like Backbone, jQuery
or Underscore you can import them into zjs with minimal trouble.

How does it work?
-----------------
zjs uses a simple API to manage dependencies. Here is a simple way to write
a module:

    
    z('app.module')
        .imports('app.my.dependency')
        .imports('app.my.otherDependency')
        .exports(function(){
            
            var Foo = function(){
                return "foo";
            }

            var Bar = app.my.dependency;

            return {
                Foo: Foo,
                Bar: Bar
            };

        });


If you don't like chaining, you can also define modules via callback. The 
`z` constructor is highly context sensitive, and you can get a few different
results depending on how you define your module. Here are, more or less, all
the other ways you can define modules in Zjs:


    // Callback with no args. The returned value of the callback
    // defines the module.
    // Good for modules that have no dependencies.
    z('foo.bar', function () {return 'foo';});

    // Callback with a single argument, which will point to the 
    // current module. You can name it whatever you want; I usually just
    // call it 'module'.
    z('foo.bin', function (module) {
        module.imports('foo.bar');
        module.exports('bar', 'bar');
    });

    // Callback with two arguments. These will be mapped to the current
    // module's 'imports' and 'exports' methods, respectively.
    z('foo.baz', function (imports, exports) {
        imports('foo.bar');
        exports('bar', 'bar');
    });

    // You can skip naming the module in the 'z' constructor
    // and define it in the callback using 'defines'. Just be sure to
    // call 'defines' somewhere, or your module won't be accessable!
    z(function (module) {
        module.defines('foo.bin');

        module.imports('foo.bar');

        module.exports({
            bar: 'bar',
            foo: 'foo'
        });
    });

    // You can also provide three arguments and define your module
    // as follows:
    z(function (defines, imports, exports) {
        defines('foo.bin');

        imports('foo.bar');

        exports({
            bar: 'bar',
            foo: 'foo'
        });
    });


You should pick a style and stick to it for your entire project, but you can mix
and match methods without breaking anything. Just, you know, don't do that.
Be consitant.

Zjs can also use plugins to import modules. The syntax is similar to
RequireJS:


    z('app.bar', function (module) {
        // Import using the 'txt' plugin
        module.imports('txt!app.bar.templates', {ext:'myFileType'});
        module.exports(function () {
            // Use in the same way as any other import.
            var foo = app.bar.templates;
        });
    });


** THE FOLLOWING PLUGIN STUFF ISN'T IMPLMENTED YET **

Zjs comes with a 'txt' plugin that lets you import files via AJAX. You can
add your own plugins with 'z.plugin':

    
    z.plugin('myPlugin', function(moduleName, next, error, options) {
        // Code
    });


Take a look in the source to get an idea of how  the 'txt' plugin was implemented: 
it's pretty simple. Also note that plugins can be placed in external Zjs modules:

    z('app.bar', function(module) {
        // Will look for the 'app.plugins.foo' module
        module.imports('app.plugins.foo!app.templates.bar');
    });

    // in app/plugins/foo.js:
    z('app.plugins.foo', function() {
        return function (moduleName, next, error, options) {
            // code
        });
    });


Compiling
----------
While you can use Zjs to load modules on a browser, you'll likely want to compile
everything before you deploy it. To do this, Zjs comes with a command-line tool:


    $ npm install zjs -g
    $ zjs build <path/to/main.js> <path/to/compiledApp.js>


The compiled file can be optimized by as well, just include the '-o' option
when building a project:
    

    $ zjs build <path/to/main.js> <path/to/compiledApp.js> -o


Zjs requires a 'main' file to properly compile a project. This is where you'll include
all your configuration options and where you'll include your first modules. Here's an example:

    
    z.config({
        root: '/scripts',
        // You can name your main module anything you like, just include the following in the config.
        // By default, zjs assumes the main module is called 'main'.
        main: 'app.main',
        // Use the shim to set up non-zjs modules.
        shim: {
            '$': {
                map: 'libs/jquery.min.js'
            },
            '_': {
                map: 'libs/underscore.js'
            },
            'Backbone': {
                map: 'libs/backbone.js',
                imports: ['_', '$'] // Including this option will ensure that backbone has underscore and jquery
            }
        },
        map: {
            // You can use patterns to map namespaces to filepaths.
            // The following will, for example, match 'foo.bar' to 'libs/foo/bar.js'
            'libs/foo/*.js': 'foo.*',
            // If you want to map an entire directory, use '**'.
            // The following will, for example, match 'baz.bif.bin.bar' to 'libs/baz/bif/bin/bar.js'
            'libs/baz/**/*.js': 'baz.**.*',
            // It's also possible to tell zjs that one file exports several modules.
            // Patterns will work here!
            'libs/bar.js': [
                'bar.bin',
                'bar.foo',
                'bar.fid.*'
            ]
        }
    });

    z('app.main', function (module) {

        module.imports('app.boot');

        module.exports(function () {
            app.boot();
        });

    });