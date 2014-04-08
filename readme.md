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

    
    z('app.module')
        .imports('app.my.dependency')
        .imports('app.my.other.dependency')
        .exports(function(){
            
            this.Foo = function(){    
                return "foo";
            }

            this.Bar = app.my.dependency;

        });


You can also define modules using a callback-style, if you'd prefer:

    
    z('app.module', function (imports, exports) {

        imports('app.my.dependency');
        imports('app.my.other.dependency');

        exports(function(){
            
            this.Foo = function(){
                return "foo";
            }

            this.Bar = app.my.dependency;

        });

    })


Zjs projects can be compiled using the command line.

    
    $ zjs build <path/to/main.js> <path/to/compiledApp.js>


No dependencies are needed to run a compiled zjs project, not even zjs.
Here's a (contrived) example of what a compiled project looks like:


    (function (global) {

    /* namespaces */
    var app = global.app = {};
    
    /* modules */
    var exporter = {};
    ;(function(){
        
        // 'this.exports' works much like 'module.exports' does in node.js.
        this.exports = "dep";

    }).call( exporter = {} );
    global.app.my.dependency = exporter.exports;
    ;(function(){
        
        this.Foo = function(){
            return "foo";
        }

        this.Bar = app.my.dependency;

    }).call( global.app.module = {} );

    })(this);


More detailed instructions coming soon.