zjs
===
Modules and a little oop

Note: zjs is currently very unstable. You're probably better off just using requireJs 
or something sensable. 

api
---
Better documentation is coming, but here's an idea of what z looks like:


    var Foo = z('app.foo')
        .imports('app.bar', 'Bar');

    Foo.exports(function(__){

        var Foo = __.Bar.extend({

            __init__:function(){
                // code
            }

        });

        // Export items
        return {
            Foo: Foo
        };

    });


You can also name each export individually, if you want:


    var Foo = z('app.foo')
        .imports('app.bar', 'Bar');

    Foo.exports('Foo', function(__){
        return __.Bar.extend({
            // code
        });
    });

    Foo.exports('Bar', function(__){

        var Foo = this.get('Foo'); // Get previously defined export
        return Foo.extend({
            // code
        });

    });

    // You can import more modules at any time
    Foo.imports('app.baz');
    Foo.exports('Bin', function(__){
        // You can now use '__.baz'.
    });


Modules can also be defined by passing a callback directly to z(). If you
don't pass any arguments to the callback, the callback will directly define
the module:

    
    z('app.foo', function(){
        return {
            foo: 'foo'
        };
    });


Passing an 'imports' and an 'exports' arg to the callback will allow you to
define the imports and exports of this module:


    z(function(imports, exports){
  
        imports('app.bar', ['Bar', 'Bin']);
        imports('app.fiz', ['Bin @ Bin2', 'Fod']); // Names can be aliased with '@' to avoid naming conflicts.

        exports(function(__){

            var Foo = __.Bin2.extends({ // 'Bin2' here is an alias for 'app.fiz.Bin'

                __init__:function(options){
                    this.__super__(options); // __super__ is availabe in all z.Classes
                    // code
                }

            });

            return {
                Foo: Foo
            };

        });

    });


Naming modules is optional, z is smart enough to name them when requested
(indeed, naming modules is not recomended). Simply create a module without
adding a name:

    
    z(function(){
        // You can also use imports and exports here.
        return {
            foo: 'foo'
        }
    });


Modules are loaded using configurable plugins. Plugins can be written, or modified,
with z.loader:
    

    z.filter('app.filter', function(req){ // Filters are used to modify request objects
        req.foo = 'foo'
        return req; // Always return req
    });

    z.loader('myLoader')
        .method(z.Script)  // The class to load things with. The only requirement is that it have a 'done' method.
        .filters(['default.src', 'app.filter']) // Register filters
        .handler(function(req, res, next, error){ // The handler is run when the request is done.
            // code
        });

    z('app.foo')
        .imports('app.bar', '*', {type: 'myLoader'}) // Use your new loader by setting 'type'
        .exports(function(__){
            // use __.bar
        });


z also comes with a simple class system. 'Bar' in the above examples could be defined
like so:


    var Bar = z.Class({
      
        __init__: function(){
            // code
        }

    });


Any class created with z.class gets the 'extends' method for free.

z understands AMD too, so you can import most AMD modules with little
trouble (jQuery included).


    z.setup({
        shim: {
            'jquery': {
            src: 'path/to/jquery-2.1.0.js'
            }
        }
    });

    z('main').
    imports('jquery').
    exports( function(__){
        __.jquery('#foo'); // Got jquery!
    });

    