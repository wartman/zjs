// z.loader
// ----------
// The loader, as its name suggests, handles all importing
// of scripts. In order to load modules correctly, the loader
// uses AJAX to load the script, then investigates it for any
// dependencies (registered with `z.imports`). The loader will 
// create a `<script>` tag once all dependencies are loaded and 
// insert the module there.
var loader = {};

// A list of visited scripts, used to ensure that things are only
// requested once.
loader.visited = {};

// A simple error handler to use if a callback is not
// provided.
function _handleErr (err) {
  if (err) throw err;
};

// Load a module via AJAX. This method will also try to parse
// the script and gather any aditional imports that are
// defined there. `next` will be called when the module is ready,
// NOT when the raw file is loaded. NodeJs callback conventions are
// followed here, and, if an error occours, `next` will be called 
// with an error as the first argument (or 'null' if all is well).
// The second argument is the next callback in the current stack
// (or `null` if we're at the end of the stack).
//
//    loader.load('app.foo', function (err, next) { /* code */ });
//
// If 'path' is an array, the loader will load each item in turn,
// then fire 'next' when all items are complete.
//
//    loader.load(['app.foo', 'app.bar'], function (err, next) { /* code */ });
//
loader.load = function (path, next) {
  next = next || _handleErr;

  if (path instanceof Array) {
    eachWait(path, function (item, next) {
      loader.load(item, next);
    })
    .done(function (err) {
      if (err) {
        next(err);
        return;
      }
      next();
    });
    return;
  }

  var mod = this.parseModulePath(path);
  var self = this;

  // If we can import this module, it's already been enabled.
  if (mod.name && !!z.imports(mod.name)){
    next();
    return;
  }

  this.request(mod.src, function (err, raw) {
    if (err) {
      next(err);
      return;
    }
    var deps = self.parse(raw);
    if (deps.length) {
      loader.load(deps, function (err) {
        if (err) {
          next(err);
          return;
        }
        self.enable(raw, mod, next);
      });
    } else {
      self.enable(raw, mod, next);
    }
  });
};

// Check if the passed item is a path
// @private
function _isPath (obj) {
  var result = false;
  result = obj.indexOf('/') >= 0;
  if (!result)
    result = obj.indexOf('.js') >= 0;
  return result;
};

// Convert a path into an object name
// @private
function _pathToName (path, options) {
  options = options || {};
  if (_isPath(path)
    && (path.indexOf('.') >= 0) 
    && options.stripExt) {
    // Strip extensions.
    path = path.substring(0, path.lastIndexOf('.'));
  }
  path = path.replace(/\//g, '.');
  return path;
};

// Convert an object name to a path
// @private
function _nameToPath (obj, options) {
  if (_isPath(obj)) {
    // This is probably already a path.
    return obj;
  }
  obj = obj.replace(/\./g, '/');
  return obj;
};

// Check z's config and map any requests that need it.
// @private
function _mapRequest (path) {
  if (_config.maps.modules.hasOwnProperty(path.name)) {
    path.src = _config.maps.modules[path.name];
    if (!_isPath(path.src)) path.src = _nameToPath(path.src) + '.js';
    return path;
  }
  each(_config.maps.namespaces, function (ns, map) {
    var match = new RegExp(map + '\\.');
    if (match.test(path.name)) {
      var item = _nameToPath(path.name.replace(match, ''));
      path.src = slashify(ns) + item + '.js';
      // Break the loop.
      return true;
    }
  });
  return path;
};

// Make sure the module path is converted into a uri.
loader.parseModulePath = function (req) {
  var root = z.config('root');
  var path = {name:'', src:''};
  if (_isPath(req)) {
    path.name = _pathToName(req, {stripExt:true});
    path.src = req;
  } else {
    path.name = req;
    path.src = _nameToPath(req) + '.js';
  }
  path = _mapRequest(path);
  // Add root.
  path.src = root + path.src;
  return path;
};

// Send an AJAX request.
loader.request = function (src, next) {
  var visited = this.visited;
  if(visited.hasOwnProperty(src)){
    visited[src].done(next);
    return;
  }
  visited[src] = new Wait();
  visited[src].done(next);

  if(root.XMLHttpRequest){
    var request = new XMLHttpRequest();
  } else { // code for IE6, IE5
    var request = new ActiveXObject("Microsoft.XMLHTTP");
  }

  request.onreadystatechange = function(){
    if(4 === this.readyState){
      if(200 === this.status){
        visited[src].resolve(this.responseText);
      } else {
        visited[src].reject(this.status);
      }
    }
  }

  request.open('GET', src, true);
  request.send();
}

// RegExp to find an import.
var _importsMatch = /z\.imports\(([\s\S\r\n]+?)\)/g;

// RegExp to cleanup module paths
var _cleanModulePath = /[\r|\n|'|"|\s]/g;

// Parse a module loaded by AJAX, using regular expressions to match
// any `z.imports` calls in the provided module. Any matches will be
// returned in an array; if no imports are found, then an empty array
// will be returned.
loader.parse = function (rawModule) {
  var self = this;
  var deps = [];
  rawModule.replace(_importsMatch, function (matches, importList) {
    var imports = importList.split(',');
    each(imports, function (item) {
      item = item.replace(_cleanModulePath, "");
      deps.push(item);
    });
  });
  return deps;
};

// Create a new script node (without inserting it into the DOM).
function _newScript (moduleName) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  if (moduleName)
    script.setAttribute('data-module', moduleName);
  return script;
};

// Place a script in the DOM
function _insertScript(script, next) {
  var head = document.getElementsByTagName("head")[0] || document.documentElement;
  head.insertBefore(script, head.firstChild).parentNode;
  if (next) {
    // If a callback is provided, use an event listener.
    var done = false;
    script.onload = script.onreadystatechange = function() {
      if (!done && (!this.readyState ||
          this.readyState === "loaded" || this.readyState === "complete") ) {
        done = true;
        next();
        // Handle memory leak in IE
        script.onload = script.onreadystatechange = null;
      }
    };
  }
};

// Add a script to the page. 'text' is the raw js code that we'll be
// injecting into the <script> tag. This is similar to just using `eval`,
// but slightly less evil.
function _addScript (mod, text, next) {

  // add a sourceURL to help with debugging
  text = text + '\n\n//# sourceURL=' + mod.src;

  var script = _newScript(mod.name);
  var done = false;

  if (z.config('debug')) {
    // Yes, we're sticking the script in the src attribute. See:
    //    https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs
    // This is done to help with debugging, as we can actually get line
    // numbers this way. Don't use this in production: some browsers,
    // like ie8, can't handle this.
    script.src = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(text);
    _insertScript(script, next);
  } else {
    script.text = text;
    _insertScript(script);
    next();
  }
};

// Take a raw module string and place it into the DOM as a `<script>`.
// This will only be run after any dependencies have been loaded first.
loader.enable = function (rawModule, mod, next) {
  next = next || _handleErr;
  _addScript(mod, rawModule, next);
};

// Load a script by placing it in the DOM
loader.getScript = function (src, next) {
  var script = _newScript();
  script.src = src;
  _insertScript(script, next);
};

z.loader = loader;
