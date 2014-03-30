zjs
===
Modules and a little oop

Note: zjs is currently very unstable. You're probably better off just using requireJs 
or something sensable. 

Table of Contents
---
* [Getting Started](#getting-started)
* [Setup](#setup)
* [Modules](#modules)
* [Plugins and Filters](#plugins-and-filters)
* [Building](#building)
* [Etc](#etc)

Getting Started
---
Zjs can be installed via NPM, which will let you use it from the command line.


    $ npm install zjs -g
    $ zjs build my/project/main.js


For use inside of projects, you can install it locally either with NPM or Bower.


    $ cd my/project
    $ bower install zjs


Zjs projects start with a 'main.js' file that set up the project and import the first
modules. Here's an example:


    z.setup({
        root: 'scripts\',
        alias: {
            'lib': 'bower_components'
        }
    });

    z('main')
        .imports('app.app')
        .exports(function(_){
            _.app.start();
        });


Zjs doesn't care how you set up your files and folders, its only job is to import and
manage modules.

Setup
---
Let's pick apart our example 'main.js' file. First, let's look at z.setup. Here it is again:


    z.setup({
        // 'root' will be appended to the start of all requests.
        // It should be relative to the file you import zjs into.
        root: 'scripts\',
        // 'alias' is a `z.filter`. We'll get into filters more in
        // depth later on, but 'alias' will be one you likely use a lot.
        alias: {
            'lib': 'bower_components'
        }
    });


With this setup, importing 'lib.foo.bar' will result in the path 'scripts/bower_components/foo/bar.js'.
You probably shouldn't go too crazy with this and try to adhere as much as possible to the actual
file paths of each model. It'll make your life easier when debugging.

Modules are declared by calling `z(<name>)` then assigning imports and exports to it.


    z('main')
        // With our setup, this will import 'scripts/app/app.js'
        .imports('app.app')
        // The argument passed to `export`'s callback contains all the requested modules.
        // You can call it whatever you want, but we've named it '_' here. The last segment
        // of the import string is used as the module name (although you can alias it and all kinds
        // of other stuff, which we'll get into in a second)
        .exports(function(_){
            _.app.start();
        });


Modules
---
Let's take a look at the `app.app` module our `main` module imported. 


    // Found in scrips/app/app.js
    z().
    imports('app.foo.views', ['Hello', 'Goodbye']).
    exports(function(_){

        return {
            start: function(){
                var hello = new _.Hello();
                console.log( hello.sayHi() );
            },
            end: function(){
                var bye = new _.Goodbye();
                console.log( bye.sayBye() );
            }
        };

    });


You'll note that the module hasn't been given a name. This is the recomended way to
do things: zjs will automatically assign a name to the module based on the path
you used to import it.

Note the array we've passed to `imports` here. This will return the 'Hello' and 'Goodbye'
components from the 'app.foo.views' module, which we can then use in our exports callback.

You'll probably note that this style of writing modules has some drawbacks -- forgetting
those periods is easy, and will cause things to break. Luckilly, zjs has an alternate syntax
you can use. Let's look at the 'app.foo.views' module.


    // found in scripts/app/foo/views.js

    // `z` is aliased as `module` if you prefer things to be a bit more synatically correct.
    // This could also be written as `z(function(imports, exports){ ... })
    module(function(imports, exports){

    // 'txt!' is telling zjs that it should get a txt file here, rather then trying to load
    // `app.foo.txt.hello` as a script. We'll get more into loaders like this later.
    imports('txt!app.foo.txt.hello');
    imports('txt!app.foo.txt.goodbye');

    exports(function(_){
        
        var Hello = function(){
            this.text = _.hello;
        }
        Hello.prototype.sayHi = function(){
            return this.text;
        }

        var Goodbye = function(){
            this.text = _.goodbye;
        }
        Goodbye.prototype.sayBye = function(){
            return this.text;
        }

        return {
            Hello: Hello,
            Goodbye: Goodbye
        };
    });

    });


This callback method is reccomended, as it has less chance of throwing you off (and is also more 'correct').
If you need to name a module, simply pass the name as the first argument:


    z('my.module', function(imports, exports){ ... });


Plugins and Filters
---
Note: I've decided this is far too clunky: I'm in the process of replacing it with rack-style middleware.

When you import something in zjs, a request object is created that first passes through a number of filters
before being handed off to a loader. Before getting into anything else, lets look at a request object.
This one was generated by calling `imports('app.foo.bar', 'Bin')`:


    {
        from: 'app.foo.bar', // The module name.
        uses: ['Bin'], // The components we want, if any.
        options: {} // Other settings.
    }


After being filtered by the default filters, it will look like this:

    
    {
        from: 'app.foo.bar',
        uses: ['Bin'],
        src: 'scripts/app/foo/bar.js',
        options: {
            ext: 'js',
            type: 'script'
        }
    }


Filters are grouped into 'scopes'. The type of request we make determines what filters the request is passed through,
but all requests are sent through the 'all' filters before being loaded. To demonstrate, let's add a filter to the 'all'
scope.

    
    z.filter('all', 'fooExt', function(req){
        req.options.ext = 'foo';
        return req;
    });


Now our request object looks like this when we filter it:


    {
        from: 'app.foo.bar',
        uses: ['Bin'],
        src: 'scripts/app/foo/bar.foo', // Our extension has been replaced by 'foo'.
        options: {
            ext: 'foo',
            type: 'script'
        }
    }


If we want to limit filters to, say, ajax requests only, we simply place the filter in the 'ajax' scope.


    z.filter('ajax', 'fooExt', function(req){
        req.options.ext = 'foo';
        return req;
    });


Now this will only impact ajax requests.

If we want to do something more in depth then changing the request object, we need to define a loader. Here's
an example that loads some sort of 'foo' file and parses it:

    
    z.loader('foo', {
        // Use the Ajax loader to get the file
        method: z.Ajax,
        // The handler runs after the request is finished:
        handler: function(req, res, next, err){
            // z.Ajax returns a plain text file, so we need to wrap it in 
            // a z.Module which will also parse it for us:
            z(req.from)
                .imports('lib.foo.parser')
                .exports(function(_){
                    return _.parser(res);
                })
                // Get the next item in the loader queue when we're done:
                .done(next);
        },
        // The build callback is used when compiling from a '$ zjs build' call
        build: function(req, res, compiler){
            var parser = require('./libs/foo').parser;
            compiler.compile(
                'z(req.from).exports(function(){\n return \'',
                parser(res),
                '\';\n});'
            );
        }
        options: {
            ext: 'foo'
        }
    });


We can now load 'foo' files in two ways:
    

    z().imports('foo!my.foo.file').exports(function(_){ /* do stuff */ });
    // or
    z().imports('my.foo.file', '*', {type:'foo'}).exports(function(_){ /* do stuff */ });


Building
---
Zjs has a command-line app that can take a main.js file, track all its imports, and create
a single, compiled file.

The simplist way is to provide a source file and a destination:

    
    $ zjs build my/app/src/main.js my/app/dest/built.js


You can also use the 'build' option when setting up a zjs project:

    
    z.setup({
        build: {
            dest: 'my/app/dest/built.js'
        }
    });


Now you can omit the destination:

    
    $ zjs build my/app/src/main.js


Alternately, you can write a 'buildz.json' file which will cover everything:

    
    {
        "main": "my/app/src/main.js",
        "dest": "my/app/dest/built.js"
    }


Then just 'cd' into the directory and run:

    
    zjs build


You can minimize the file by calling:


    zjs build -o


Or including the following in z.setup or the buildz.json file:


    "optimize": true


or, if you want to save both a minified and non-minified version:


    "optimizeToMin": "my/app/dest/built.min.js"


A grunt plugin is in the works as well.

ETC
---
Have two modules with the same name? You can use '@' to alias one:


    z().
    imports('app.foo.views').
    imports('app.bar.views @barViews').
    exports(function(_){
        _.views; // <-- app.foo.views
        _.barViews; // <-- app.bar.views
    });


This works for components too.

Need to load a random script or do an ajax call? You can call them
using z's api:


    z.script({src:'my/file.js'}).done(function(){
        // use your script
    });

    z.ajax({src:'my/file.txt'}).done(function(res){
        // `res` holds the response.
    });


You can define exports directly, if you'd like:


    var Foo = z()
        .imports('bar.bin');

    Foo.exports('bar', function(){
        return 'bar';
    });

    Foo.exports('bin', function(_){
        return _.bin;
    });


Calling `z(module)` on an existing module will return that module for you to mess with. For example:

    
    z('foo')
    .exports(function(){
        return {
            bin: 'foo'
        };
    })

    var bin = z('foo').use('bin');

    console.log(bin); // <-- bin


Try it out in your browser's javascript console.