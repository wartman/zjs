zjs
===
A lightweight module loader for browsers.

About zjs
---------
*zjs* is a super-simple way to create modules in javascript. Here's an example:

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

Other module loaders are more robust, but *zjs* tries to keep out of your way and let you
write the code you want.


How does it work?
-----------------
When used on the browser, *zjs* loads imported scripts with AJAX, then inserts them into the DOM using a `<script>` tag.
To keep from polluting the global namespace, imported scripts are wrapped in a self-executing function first (this is done
in such a way that line-numbers will still match up with the original file). You should use a modern browser when debugging
*zjs* to get useful information when errors are thrown.

When you're ready to deploy your app, you should **always** use the *zjs* command-line tool to compile the project.
The browser-loader is best thought of as a development aid: compiled scripts will run much faster and have little overhead.

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

- z.__config__(*key*, *value*)

  Set or get a configuation option. To set several options
  at once, pass an object to `key`. To get an option without
  changing its value, simply omit the `value` arg.

- z.__map__(*mod*, *path*)
  
  Map a module to the given path.
  
  ```javascript
  z.map('Foo', 'libs/foo.min.js');
  z.imports('Foo'); // -> Imports from libs/foo.min.js
  ```

  Note that this method will automatically work with any 
  script that exports a global var, so long as `mod` is 
  equal to the global you want. Here is an example for jQuery:
  
  ```javascript
  z.map('$', 'libs/jQuery.min.js')
  ```

- z.__mapNamespace__(*ns*, *path*)

  Map a namespace to the given path.

  ```javascript
  z.mapNamespace('Foo.Bin', 'libs/FooBin');
  // The following import will now import 'lib/FooBin/Bax.js'
  // rather then 'Foo/Bin/Bax.js'
  z.imports('Foo.Bin.Bax');
  ```

- z.__start__(*mainFile*, *done*)

  Load the main module and start your app. You can call this directly, or add a
  'data-main' attribute to your script tag:

  ```html
  <script src="libs/z.js" data-main="app/main"></script>
  ```

  This method is not available in `z.runtime.js` or compiled scripts.

- z.__startConfig__(*configFile*, *done*)
  
  If you need to do any configuration for your app (such as adding maps, etc)
  you should use this method. 

  Here's an example of a config file:

  ```javascript
  z.config({
    root: 'scripts/'
    main: 'app.main'
    // You can also map modules and namespaces
    // here, if you need to.
    maps: {
      modules: {
        'foo' : 'libs/foo/foo.js'
      }
    }
  });
  ```

  By convention, this file is named 'config.js', but you can
  call it whatever you'd like. Once the config is ready, zjs 
  will try to fetch `z.config('main')`.

  You can call this directly, or add a 'data-config' attribute 
  to your script tag:

  ```html
  <script src="libs/z.js" data-config="app/config"></script>
  ``` 

  This method is not available in `z.runtime.js` or compiled scripts.

