zjs
===
A lightweight module loader for browsers.

What makes zjs different?
-------------------------
Zjs is designed to let you work with modules without loading you down
with any extra code. In fact, compiled zjs projects don't use any extra code
at all - they're just simple javascript.

How does it work?
-----------------
zjs uses a simple API to manage dependencies. A module is written as follows:

    
    module('app.module').
    import('app.my.dependency').
    export(function(){
        
        this.Foo = function(){
            // code
        }

        this.Bar = app.my.dependency.extend({
            // code
        });

    });


Compiled, it looks like this:

    
    /* namespaces */
    var app = global.app = {};
    global.app.module = {};
    // etc.
    
    /* modules */
    // more here
    ;(function(){
        
        this.Foo = function(){
            // code
        }

        this.Bar = app.my.dependency.extend({
            // code
        });

    }).call( global.app.module );


That's pretty much all there is to it.