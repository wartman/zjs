zjs
===
A lightweight module loader for browsers.

About zjs
---------
Zjs is a super-simple way to create modules in javascript. Here's a simple example:

```js

z.module('foo.bar');

z.imports(
 'foo.bin',
 'foo.bax'
);

foo.bar.SomeFunction = function () {
  //code;
};

```

No need for wrappers or anything else. Just a few method calls at the top of your
script.

It's not the most robust option, but ZJS tries to keep out of your way and let you
write the code you want.


How does it work?
-----------------
When you import a script, ZJS uses AJAX to load it. It investigates the file, looking
for any dependencies via a regular expression. Once everything is loaded, it places
the script into the DOM.

An important note: in order to provide useful debugging information ZJS loads each script
twice: once via ajax and once via a `<script>` tag. This is obviously not useable in a 
production environment, which is why you should always compile your project before deploying it.
If you absolutely need to load scripts dynamically, you can set `z.config('debugging', false);`
and scripts will be dynamically insterted without a second request. You won't be able to check
line numbers with this method, however, so only use it on a script you know works well.

Compiling is highly recomended, however. To compile a project, use the `zjs` command-line tool:

```
$ zjs build path\to\my\main\module.js path\to\dest.js
```

You can optimize the script from the command line as well, simply add the '-o' option:

```
$ zjs build path\to\my\main\module.js path\to\dest.js -o
```

Compiled projects use the tiny zjs runtime script, not the entire library, making zjs even more lightweight.


API 
---
The following is the core API, which is always available.

- z.__module__(*name*)

  Creates a new module. This method creates an object based on
  the passed module path, ensuring that all segments are defined.
  It should be at the top of every zjs module.

  ```javascript 
  z.module('app.foo.bar');
  // The module is now available as a basic javascript object.
  app.foo.bar.Bin = function () { /* code */ };
  ```

- z.__imports__(*...*)

  Import a module or modules. Imported modules are then available for the
  current module.

  You can import all dependencies at once by overloading this method, or
  load them one at a time. For example:

  ```javascript
  z.imports(
    'app.foo',
    'app.bar'
  );
  ```

  If only one argument is passed, `z.imports` will return that module. This
  can be handy if you want to alias a module for whatever reason:

  ```javascript
  var foo = z.imports('app.long.unweildly.module.path.foo');
  ```

There's more, but this is all thats working at the moment.

