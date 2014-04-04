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

    
    module('app.module')
    .import('app.my.dependency')
    .export(function(){
        
        this.Foo = function(){
            // code
        }

        this.Bar = app.my.dependency;

    });


Compiled, it looks like this:


    (function(global){

    /* namespaces */
    var app = global.app = {};
    global.app.module = {};
    global.app.my = {};
    global.app.my.dependency = {};
    
    /* modules */
    var exporter = {};
    ;(function(){
        
        // 'this.exports' works much like 'module.exports' does in node.js.
        this.exports = "dep";

    }).call( exporter );
    global.app.my.dependency = exporter.exports;
    ;(function(){
        
        this.Foo = function(){
            // code
        }

        this.Bar = app.my.dependency;

    }).call( global.app.module );

    }).call(this);


The zjs library isn't even refered to.

AMD?
----
Zjs doesn't currently load AMD, although it might soon. Really though, you
should use something like requirejs for bigger projects - zjs works well
for smaller things.