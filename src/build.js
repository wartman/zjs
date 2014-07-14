// z.Build

require('./z');

var fs 		   = require('fs');
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
	this._compiled = '';
	this._header = '';
	this._dir = (options.dir || process.cwd()) + '/';
  this._onDone = function () {};
	this.options = options;

	// Overwrite default loaders.
	var builder = this;
	z.load = function (mod, next, error) {
    var src = builder._dir + z.sys.getPath(mod);
    fs.readFile(src, 'utf-8', function (err, data) {
      if (err) {
        throw err;
        error(err);
        return;
      }
      builder._raw[mod] = data;
      builder.extractLicenses(data);
      // Run the module
      try {
	      var runner = Function(data);
	      runner();
      	next(data);
      } catch (e) {
      	throw e;
      	error(e);
      }
    });
	};
  z.file = function (mod, next, error) {
    fs.readFile(mod, 'utf-8', function (err, data) {
      if (err) {
        throw err;
        error(err);
        return;
      }
      next(data);
    });
  };

	// Start gathering scripts
	this.start(this._main);
};

Build.prototype.start = function(main) {
	var self = this;
	z.load(main, function (data) {
		if (z.config('main')) {
			self._main = z.config('main');
			self._raw[self._main] = data;
		}
		z.env.modules[self._main].done(function () {
			self.compile();
		}, function (e) {
      throw new Error(e);
    });
	}, function (error) {
		throw new Error(error);
	});
};

Build.prototype.done = function (cb) {
  if (this.isDone)
    cb();
  else
    this._onDone = cb;
};

/**
 * Try to extract license info from included modules.
 */
var _licenseMatch = /\/\*\![\s\S]+?\*\//g;
Build.prototype.extractLicenses = function (file) {
  var matches = _licenseMatch.exec(file);
  if (!matches) return;
  this._header += matches[0] + '\n\n';
};

Build.prototype.compile = function () {
	var modules = z.env.modules;
	var packageList = {};
	var sortedPackages = [];
	var self = this;

	for (var pack in modules) {
		var list = [];
		var raw = modules[pack].deps;
		raw.forEach(function (item) {
			list.push(item.id);
		})
		packageList[pack] = list;
	}

	sortedPackages = this.sort(packageList, this._main);

	sortedPackages.forEach(function (name) {
		self._compiled += self._raw[name] + '\n';
	});

	// Add the minimal implementation of z unless otherwise requested.
	if (z.config('compile.full')) {
		var lib = fs.readFileSync(__dirname + '/z.js', 'utf-8');
	} else {
		var lib = fs.readFileSync(__dirname + '/zMinimal.js', 'utf-8');
	}

	// Add library
	this._compiled = "(function (root) {\n" + lib + "\n\n/* modules */\n" + this._compiled + "\n})(this);"

	if(this.options.optimize){
    this._compiled = UglifyJS.minify(this._compiled, {fromString: true}).code;
    // Add license headers. (to do)
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