// z.Build
// -------

require('../dist/z');

var fs = require('fs');
var UglifyJS = require("uglify-js");

var Build = function (options) {
	options = options || {};

	// Setup.
	z.config(options);
	z.config('compile.running', true);

	// Instance properties
	this._raw = {};
	this._main = options.main || 'main';
	this._dest = options.dest;
	this._compiled = [];
	this._header = '';
	this._dir = (options.dir || process.cwd()) + '/';
  this._onDone = function () {};
	this.options = options;

  this.modules = {};
  this.fs = fs;

	// Overwrite default loaders.
	var builder = this;
  var rootpath = builder._dir + z.config('root');
  z.config('root', rootpath);
  z.config('building', true);
};

var _buildInstance = null;

Build.getInstance = function (options) {
  if (!_buildInstance) 
    _buildInstance = new Build(options);
  return _buildInstance;
};

// Start compiling.
Build.prototype.start = function () {
	var self = this;
  var loader = z.Loader.getInstance();

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

    loader.load(self._main, function (err) {
      if (err) 
        throw err;
      else
        self.compile();
    });

  });

  return this;
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
	var modules = this.modules;
	var moduleList = {};
	var sortedModules = [];
	var self = this;
  var loader = z.Loader.getInstance();

	for (var mod in modules) {
		var list = [];
		var raw = modules[mod].deps;
    if (raw) {
  		raw.forEach(function (item) {
  			list.push(item);
  		});
    }
		moduleList[mod] = list;
	}

	sortedModules = this.sort(moduleList, this._main);

  // Add compiled modules in order of dependencies.
	sortedModules.forEach(function (name) {
    mod = loader.parseModulePath(name);
		self._compiled.push(modules[mod.name].data);
	});

	// Add the minimal implementation of z unless otherwise requested.
	if (z.config('compile.full')) {
		var lib = fs.readFileSync(__dirname + '/../dist/z.js', 'utf-8');
	} else {
		var lib = fs.readFileSync(__dirname + '/../dist/z.runtime.js', 'utf-8');
	}

	// Put it together.
  output = "\n;(function (root) {\n"
    + lib + "\n"
    + '\n/* config */\n' + this._config + ';\n'
    + "\n/* modules */\n" + this._compiled.join('\n')
    + "})(this);"

	if(this.options.optimize){
    output = UglifyJS.minify(output, {fromString: true}).code;
    // Add license headers.
    output = this._header + output;
  }

  if(this._dest)
    fs.writeFileSync(this._dir + this._dest, output);

  this._onDone(null, output);
  return output;
};

// Topological sorter for dependencites. Sorts modules in order
// of dependency.
Build.prototype.sort = function (dependencies, root) {

  var nodes = {};
  var nodeCount = 0;
  var ready = [];
  var output = [];

  // build the graph
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
};

z.Build = Build;
