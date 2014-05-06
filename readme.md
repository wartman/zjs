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
a module (using the 'chaining' flavor):

```JavaScript    
z('app.module')
    .imports('app.my.dependency')
    .imports('app.my.otherDependency')
    .exports(function(){
        
        var Foo = function(){
            return "foo";
        }

        var Bar = app.my.dependency;

        // Define what this module exports by returning
        // something.
        return {
            Foo: Foo,
            Bar: Bar
        };

    });
```

If you don't like chaining, you can also define modules via a factory callback. You can
define modules using several different "flavors" depending on the number of 
arguments you pass to the `z` constructor and the `factory` callback. These
are all purely aesthetic, and function the same internally. Here are examples of each:

```JavaScript 
// The 'no-dependencies' flavor, where no args are passed
// to the factory. This is good for modules with a single export.
z('foo.bar', function () {return 'foo';});

// The 'module-context' flavor, where a single arg is passed to the
// factory. This arg points to the current module, and you can
// call its imports and exports methods using chaining or individually.
z('foo.bin', function (module) {
    module
        .imports('foo.bar')
        .imports('foo.bar');
    module.exports('bar', 'bar');
});

// The 'imports-exports' flavor, where two args are passed. These
// are mapped to the current module's 'import' and 'export' methods,
// respectively. If you're not compiling your ZJS project, this method
// may result in marginally better minification.
z('foo.baz', function (imports, exports) {
    imports('foo.bar');
    imports('foo.bin');
    exports('bar', 'bar');
});

// The 'defines-module-context' flavor, similar to the 'module-context'
// flavor, but which requires you to use the 'defines' method somewhere so
// Zjs knows what to call this module. Use this if you find it asthetically
// pleasing.
z(function (module) {
    module.defines('foo.bin');

    module.imports('foo.bar');

    module.exports({
        bar: 'bar',
        foo: 'foo'
    });
});

// The 'defines-imports-exports' flavor is an alternative to the above,
// if you like using psuedo-keywords.
z(function (defines, imports, exports) {
    defines('foo.bin');

    imports('foo.bar');

    exports({
        bar: 'bar',
        foo: 'foo'
    });
});
```

This read-me will use the "module-context" flavor for the rest of the examples,
but you can use whichever one you like the best. However, you should pick a style 
and stick to it for your entire project. You CAN mix and match methods without 
breaking anything, but, you know, don't do that. Be consistent.

Zjs can also use plugins to import modules. The syntax is similar to
RequireJS:

```JavaScript 
z('app.bar', function (module) {
    // Import using the 'txt' plugin
    module.imports('txt!app.bar.templates', {ext:'myFileType'});
    module.exports(function () {
        // Use in the same way as any other import.
        var foo = app.bar.templates;
    });
});
```

Zjs comes with a 'txt' plugin that lets you import files via AJAX. You can
add your own plugins with 'z.plugin':

```JavaScript 
z.plugin('myPlugin', function(moduleName, next, error, options) {
    // Code
});
```

Take a look in the source to get an idea of how  the 'txt' plugin was implemented, it's pretty simple. 

Compiling
---------
While you can use Zjs to load modules on a browser, you'll likely want to compile
everything before you deploy it. To do this, Zjs comes with a command-line tool:

```
$ npm install zjs -g
$ zjs build <path/to/main.js> <path/to/compiledApp.js>
```

The compiled file can be optimized by as well, just include the '-o' option
when building a project:
    
```
$ zjs build <path/to/main.js> <path/to/compiledApp.js> -o
```

Zjs requires a 'main' file to properly compile a project. This is where you'll include
all your configuration options and where you'll include your first modules. Here's an example:

```JavaScript 
z.config({
    root: '/scripts',
    // You can name your main module anything you like, 
    // just include the following in the config.
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
        // The following will, for example, match 'foo.bar' 
        // to 'libs/foo/bar.js'
        'libs/foo/*.js': 'foo.*',
        // If you want to map an entire directory, use '**'.
        // The following will, for example, match 'baz.bif.bin.bar' to 'libs/baz/bif/bin/bar.js'
        'libs/baz/**/*.js': 'baz.**.*',
        // It's also possible to tell zjs that one file 
        // exports several modules.
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
```