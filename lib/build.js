var fs = require('fs');
var path = require('path');

// Helpers
// -------
// @todo: remove both of these funcs: they're not really
//        required.

// Iterate over all items in an object or an array
function each(obj, fn, ctx) {
  if (!obj) return obj;
  ctx || (ctx = obj);
  if (!(obj instanceof Array)) {
    for (var key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        fn.call(ctx, obj[key], key);
      }
    }
  } else {
    for (var i=0, len=obj.length; i < len; i++) {
      fn.call(ctx, obj[i], i);
    }
  }
  return obj
};

// Set defaults for an object
function defaults(obj) {
  var length = arguments.length;
  if (length < 2 || obj == null) return obj;
  for (var index = 1; index < length; index++) {
    var source = arguments[index];
    var keys = Object.keys(source);
    var l = keys.length;
    for (var i = 0; i < l; i++) {
      var key = keys[i];
      if (obj[key] === void 0) obj[key] = source[key];
    }
  }
  return obj;
};

// Build
// -----
// This class takes Z modules and compiles them into a single file.
//
// @todo: Make this all work with pipes, so you can just stick it into
//        gulp and call it a day.
//
var Build = function (options) {
  if (!(this instanceof Build)) return new Build(options);
  this.options = defaults((options || {}), {
    src: '',
    dest: '',
    main: false,
    compiledName: 'app',
    includeZjs: true, // Include core z files
    minimalZjsBuild: false // If true, won't include the ZJS loader.
  });
  this.namespaces = {};
  this.loaded = {};
  this.modules = {};
  if (this.options.main) this.load(this.options.main);
};

var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
var moduleImports = /\.imports\s*\(\s*([^\)]+)\s*\)/g;
var moduleName = /module\s*\(\s*["']([^'"\s]+)["']\s*\)/g;

Build.prototype.load = function(req) {
  if (req instanceof Array) {
    each(req, function (item) {
      this.load(item);
    }, this);
    return;
  }
  if (!this.loaded[req]) {
    this.loaded[req] = true;
    var contents = this.readModule(req);
    this.addModule(req, contents, {wrap: true});
  }
};

Build.prototype.addModule = function (name, contents, options) {
  options || (options = {});
  name = name.trim();
  var mod = this.modules[name] = {
    contents: contents,
    deps: this.findDeps(contents)
  };
  if (mod.deps.length) {
    this.load(mod.deps);
  }
};

Build.prototype.findDeps = function (str) {
  var deps = [];
  var _this = this;
  str
    .replace(commentRegExp, '')
    .replace(moduleImports, function (match, depList) {
      var parts = depList.split(',');
      each(parts, function (dep) {
        if (!dep) return;
        dep = dep.replace(/["']/g, "");
        dep = dep.trim();
        deps.push(dep);
      });
    });
  return deps;
};

Build.prototype.toFullPath = function (name, options) {
  options || (options = {})
  return path.join(
    this.options.src, 
    name.replace(/\./g, path.sep) + (options.ext || '')
  );
};

Build.prototype.readModule = function(pack) {
  var url = this.toFullPath(pack, {ext:'.js'});
  return fs.readFileSync(url, 'utf-8');
};

Build.prototype.compile = function() {
  var _this = this;
  var sortedModules = [];
  var moduleList = {};
  var out = []

  console.log('----------\nStarting build\n----------');

  each(this.modules, function (module, name) {
    moduleList[name] = module.deps;
  });
  sortedModules = this.sort(moduleList, this.options.main);

  out.push('/*');
  out.push([
    ' * This is an automatically generated file.',
    ' * Please don\'t modify it: instead, change the source',
    ' * files and run the build script again.'
  ].join('\n'));
  out.push(' */\n');
  if (this.options.includeZjs) {
    console.log(' * Adding: Z Core');
    out.push(this.createZjsBuild({
      minimalBuild: this.options.minimalZjsBuild
    }));
  }

  // Add sorted modules.
  out.push('/* Modules */');
  each(sortedModules, function (name) {
    console.log(' * Adding: ' + name)
    out.push(this.modules[name].contents);
  }, this);

  fs.writeFileSync(this.options.dest + path.sep + this.options.compiledName + '.js', out.join('\n'));

  console.log('----------\nDone\n----------');
};

Build.prototype.createZjsBuild = function (options) {
  if (!options) options = {};
  var srcFolder = __dirname + path.sep + '..' + path.sep + 'src' + path.sep;
  var content = '';
  content += fs.readFileSync(srcFolder + 'intro.js', 'utf-8');
  content += fs.readFileSync(srcFolder + 'module.js', 'utf-8');
  if (!options.minimalBuild) 
    content += fs.readFileSync(srcFolder + 'loader.js', 'utf-8');
  else
    content += fs.readFileSync(srcFolder + 'loader-minimal.js', 'utf-8');
  content += fs.readFileSync(srcFolder + 'z.js', 'utf-8');
  content += fs.readFileSync(srcFolder + 'outro.js', 'utf-8');
  return content;
};

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

module.exports = Build;
