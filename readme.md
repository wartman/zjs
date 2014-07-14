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
Zjs lets you split your javascript project up into different files, what Zjs calls 'packages'.
All code written in a package file should be wrapped by Zjs to ensure that it is only
executed when all dependencies are loaded. Here's an example:

```js

    z('App.Foo', function () {
        z.imports('App.Bar');

        App.Foo.Bin = App.Bar.extend({
            foo: 'foo'
        });
    });

```
