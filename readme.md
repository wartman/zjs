zjs
===
A lightweight module loader for browsers.

```javascript

z.module(
    'app.foo'
).imports(
    'lib.bar',
    'lib.bin'
).define(function () {
    app.foo.getFoo = function () {
        return 'foo';
    };
    app.foo.bar = lib.bar.getBar();
});

```
