// z.Build
// -------

require('../dist/z');

var fs = require('fs');
var UglifyJS = require("uglify-js");

var Build = z.Build = function (options) {
	if (!(this instanceof z.Build)) return new z.Build(options);

	options = options || {};

	// Setup.
	z.config(options);
	z.config('compile.running', true);

	// Instance properties
	this._raw = {};
	this._main = options.main || 'main';
	this._dest = options.dest;
  this._namespaces = [];
	this._compiled = '';
	this._header = '';
	this._dir = (options.dir || process.cwd()) + '/';
  this._onDone = function () {};
	this.options = options;

	// Overwrite default loaders.
	var builder = this;
  var rootpath = builder._dir + z.config('root');
  z.config('root', rootpath);

	z.loader.load = function (path, next) {
    next = next || function (err) { if (err) throw err; };

    var mod = this.parseModulePath(path);
    var self = this;

    // Add root-level namespaces.
    var ns = mod.name.substring(0, mod.name.indexOf('.'));
    if (builder._namespaces.indexOf(ns) < 0) {
      builder._namespaces.push(ns);
    }

    fs.readFile(mod.src, 'utf-8', function (err, data) {
      if (err) {
        throw err;
        error(err);
        return;
      }
      var deps = self.parse(data);

      builder._raw[mod.name] = {
        data: data,
        deps: deps
      };
      builder.extractLicenses(data);
      if (deps.length) {
        var remaining = deps.length;
        deps.forEach(function (dep) {
          z.loader.load(dep, function (err) {
            remaining -= 1;
            if (err) {
              next(err);
              return;
            }
            if (remaining <= 0) {
              next();
            }
          });
        });
      } else {
        next();
      }
    });
	};

	// Start gathering scripts
	this.start(this._main);
};

// Start compiling.
Build.prototype.start = function() {
	var self = this;

  fs.readFile(this._main, 'utf-8', function (err, data) {

    // If this is a config file, try to parse it.
    var getConfig = /z\.config\([\s\S\r\n'"\{\}]+?\)/g
    var config = getConfig.exec(data);
    if (config) {

      self._config = config;
      var runner = Function('z', config);
      runner(z);
      if (z.config('main')) {
        self._main = z.config('main');
      } 
      if (z.config('root')) {
        var rootpath = self._dir + z.config('root');
        z.config('root', rootpath);
      }
    } else {

      // Try to infer defaults.
      var lastSegment = (self._main.lastIndexOf('/') + 1);
      var root = self._main.substring(0, lastSegment);
      var main = self._main.substring(lastSegment);
      z.config('root', root);
      z.config('main', main);
      self._main = main;
      self._config = [
        "z.config({",
          "main:'" + main + "',",
          "root:'" + root + "'",
        "})"
      ].join('');

    }

    z.loader.load(self._main, function (err) {
      if (err) 
        throw err;
      else
        self.compile();
    });

  });
};

// A callback to fire when everything is ready.
Build.prototype.done = function (cb) {
  if (this.isDone)
    cb();
  else
    this._onDone = cb;
};

// Try to extract license info from included modules.
var _licenseMatch = /\/\*\![\s\S]+?\*\//g;
Build.prototype.extractLicenses = function (file) {
  var matches = _licenseMatch.exec(file);
  if (!matches) return;
  this._header += matches[0] + '\n\n';
};

// Compile the project.
Build.prototype.compile = function () {
	var modules = this._raw;
	var moduleList = {};
	var sortedPackages = [];
	var self = this;

	for (var mod in modules) {
		var list = [];
		var raw = modules[mod].deps;
		raw.forEach(function (item) {
			list.push(item);
		})
		moduleList[mod] = list;
	}

	sortedPackages = this.sort(moduleList, this._main);

	sortedPackages.forEach(function (name) {
    // Add each module, wrapping it in a function first..
		self._compiled += "\n;(function () {\n" + self._raw[name].data + "\n})();\n";
	});

	// Add the minimal implementation of z unless otherwise requested.
	if (z.config('compile.full')) {
		var lib = fs.readFileSync(__dirname + '../dist/z.js', 'utf-8');
	} else {
		var lib = fs.readFileSync(__dirname + '/api.js', 'utf-8');
	}


  // Add root namespaces
  var namespaces = [];
  this._namespaces.forEach(function (ns) {
    namespaces.push('var ' + ns + '= root.' + ns +' = {};');
  });


	// Put it together.
	this._compiled = "\n;(function (root) {\n" 
    + lib
    + '\n\n/* namespaces */\n' + namespaces.join('\n') + '\n'
    + '\n\n/* config */\n' + this._config + ';\n'
    + "\n\n/* modules */\n" + this._compiled 
    + "\n})(this);"

	if(this.options.optimize){
    this._compiled = UglifyJS.minify(this._compiled, {fromString: true}).code;
    // Add license headers.
    this._compiled = this._header + this._compiled;
  }

  if(this._dest){
    fs.writeFileSync(this._dir + this._dest, this._compiled);
    this._onDone();
  } else {
    this._onDone();
  }

  return this._compiled;
};

// Topological sorter for dependencites. Sorts modules in order
// of dependency.
Build.prototype.sort = function (dependencies, root) {

  var nodes = {};
  var nodeCount = 0;
  var ready = [];
  var output = [];

  // Build the graph
  function add (element) {
    nodeCount += 1;
    nodes[element] = { needs:[], neededBy:[], name: element };
    
    if (dependencies[element]) {
      dependencies[element].forEach(function (dependency) {
        if (!nodes[dependency]) add(dependency);
        nodes[element].needs.push(nodes[dependency]);
        nodes[dependency].neededBy.push(nodes[element]);
      });
    }

    if (!nodes[element].needs.length) ready.push(nodes[element]);
  }

  if (root) {
    add(root);
  } else {
    for (var element in dependencies) {
      if (!nodes[element]) add(element);
    }
  }

  // Sort the graph
  while (ready.length) {
    var dependency = ready.pop();
    output.push(dependency.name);
    dependency.neededBy.forEach(function (element) {
      element.needs = element.needs.filter(function (x) {return x!=dependency});
      if(!element.needs.length) ready.push(element);
    });
  }

  // Error check
  if (output.length != nodeCount) {
    throw Error("circular dependency");
  }

  return output;
}