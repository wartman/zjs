// z.Loader
// --------
// The Loader, as its name suggests, handles all importing
// of scripts. 
var Loader = function (options) {
  options = options || {};
  this.visited = {};
  this.options = defaults({
    // ???
  }, options);
};

// Used with 'getInstance()'
var _loaderInstance = null;

// Get a singleton instance of z.Loader. If this
// is the first time `getInstance` is called, the
// options arg will be passed to z.Loader's constructor.
Loader.getInstance = function (options) {
  if (!_loaderInstance)
    _loaderInstance = new Loader(options);
  return _loaderInstance;
}

// A simple error handler to use if a callback is not
// provided.
function _handleErr (err) {
  if (err) throw err;
};

// Check if the passed item is a path
function _isPath (obj) {
  var result = false;
  result = obj.indexOf('/') >= 0;
  if (!result)
    result = obj.indexOf('.js') >= 0;
  return result;
};

// Convert a path into an object name
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

// Check a path for a plugin. 
// @private
function _checkForPlugin (prop, path) {
  var req = path[prop];
  var parts = req.split(':');
  if (parts.length > 1) {
    path.plugin = parts[0].trim();
    path[prop] = parts[1].trim();
  }
}

// Make sure the module path is converted into a uri,
// check for the correct plugin to use, and apply any maps
// that have been registered.
Loader.prototype.parseModulePath = function (req) {
  var root = z.config('root');
  var path = {req: req, name: '', src: '', plugin: '__module'};
  _checkForPlugin('req', path);
  req = path.req;
  if (_isPath(req)) {
    path.name = _pathToName(req, {stripExt:true});
    path.src = req;
  } else {
    path.name = req;
    path.src = _nameToPath(req) + '.js';
  }
  path = _mapRequest(path);
  // Maps can indicate plugins too, so check again
  _checkForPlugin('src', path);
  // Add root.
  path.src = root + path.src;
  return path;
};

// Grab a module or modules, using the correct plugin.
Loader.prototype.load = function (path, next) {
  var self = this;
  next = next || _handleErr;

  if (path instanceof Array) {
    eachWait(path, function (item, next) {
      self.load(item, next);
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

  z.usePlugin((mod.plugin || '__module'), function (plugin) {
    if (z.config('building')) {
      plugin.build(mod, next);
    } else {
      plugin.handler(mod, next);
    }
  });
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

// Add a script to the page.
function _addScript (mod, text, next) {

  // add a sourceURL to help with debugging
  text += '\n//# sourceURL=' + mod.src;

  var script = _newScript(mod.name);
  var done = false;

  // We don't get useful line numbers if we just let the 
  // browser handle syntax errors, so we need to use the following code.
  // @todo: Firefox seems to get a line-number one less then it should be.
  var oldErr = window.onerror || null;
  window.onerror = function (errorMsg, url, lineNumber) {
    if (errorMsg.indexOf('SyntaxError') >= 0) {
      var message = errorMsg + '\n\tEvaluating [' + mod.name + '] on line ' + lineNumber;
      if (oldErr) return oldErr(message, url, lineNumber);
      console.error(message);
      return true;
    }
    // Otherwise, it's fine to let the browser handle runtime errors.
    return oldErr? oldErr(errorMsg, url, lineNumber) : false;
  };

  script.appendChild(document.createTextNode(text));
  _insertScript(script);

  // Rebind the old error handler.
  window.onerror = oldErr;

  next();
};

// Send an AJAX request.
Loader.prototype.requestAJAX = function (src, next) {
  var visited = this.visited;
  if(visited.hasOwnProperty(src)){
    visited[src].done(next);
    return;
  }
  var visit = visited[src] = new Wait();
  visit.done(next);

  if(root.XMLHttpRequest){
    var request = new XMLHttpRequest();
  } else { // code for IE6, IE5
    var request = new ActiveXObject("Microsoft.XMLHTTP");
  }

  request.onreadystatechange = function(){
    if(4 === this.readyState){
      if(200 === this.status){
        visit.resolve(this.responseText);
      } else {
        visit.reject('AJAX Error: Could not load [' + src + '], status code: ' + this.status);
      }
    }
  }

  request.open('GET', src, true);
  request.send();
};

// Load a script by placing it in the DOM
Loader.prototype.requestScript = function (src, next) {
  var visited = this.visited;
  if(visited.hasOwnProperty(src)){
    visited[src].done(next);
    return;
  }

  var visit = visited[src] = new Wait();
  visit.done(next);

  var script = _newScript();
  script.src = src;
  script.async = true;
  _insertScript(script, function () {
    visit.resolve();
  });
};

// Take a raw module string and place it into the DOM as a `<script>`.
Loader.prototype.enable = function (compiled, mod, next) {
  next = next || _handleErr;
  _addScript(mod, compiled, next);
};

z.Loader = Loader;
