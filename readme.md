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



Naming modules is optional, z is smart enough to name them when requested
(indeed, naming modules is not recomended). Here is another style of writing a
z module (note the periods!):
  
    imports('app.bar', ['Bar', 'Bin']).        // Calling 'imports(...)' is the same as calling 'z().imports(...)'
    imports('app.fiz', ['Bin @ Bin2', 'Fod']). // Names can be aliased with '@' to avoid naming conflicts.

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

    