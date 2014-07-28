// z.parser
// --------
// The parser handles module dependencies and the like.
var parser = {};

// RegExp to find an import.
var _importsMatch = /z\.imports\(([\s\S\r\n]+?)\)/g;

// RegExp to find the module name
var _moduleNameMatch = /z\.module\(([\s\S]+?)\)/g

// RegExp to cleanup module paths
var _cleanModulePath = /[\r|\n|'|"|\s]/g;

// Ensures that top-level (or root) namespaces are defined.
// For example, in `app.foo.bar` the root namespace is `app`.
// If a module-name has only one segment, like `main`, then `main`
// is the root.
function _ensureRootNamespace (name) {
  var loader = z.Loader.getInstance();
  name = loader.parseModulePath(name).name;
  var ns = (name.indexOf('.') > 0) 
    ? name.substring(0, name.indexOf('.'))
    : name;
  // z.namespace(ns);
  var namespaces = z.getNamespaces();
  if (!namespaces.hasOwnProperty(ns)) {
    namespaces[ns] = true;
  }
};

// Parse a module loaded by AJAX, using regular expressions to match
// any `z.imports` calls in the provided module. Any matches will be
// returned in an array; if no imports are found, then an empty array
// will be returned.
parser.getDeps = function (rawModule) {
  var self = this;
  var deps = [];
  var nsList = [];
  rawModule.replace(_importsMatch, function (matches, importList) {
    var imports = importList.split(',');
    each(imports, function (item) {
      item = item.replace(_cleanModulePath, "");
      _ensureRootNamespace(item)
      deps.push(item);
    });
  });
  rawModule.replace(_moduleNameMatch, function (matches, modName) {
    var item = modName.replace(_cleanModulePath, "") 
    z.module(item);
    _ensureRootNamespace(item);
  })
  return deps;
};

// Wrap a module in a function to keep it from messing with globals. This
// will also provide it with any required namespaces.
parser.wrap = function (rawModule) {
  var nsVals = [];
  var nsList = [];
  var compiled = '';
  var namespaces = z.getNamespaces();
  each(namespaces, function (val, ns) {
    nsVals.push("z.namespace('" + ns + "')");
    nsList.push(ns);
  });
  nsVals.push('z');
  nsList.push('z');

  compiled = ";(function (" + nsList.join(', ') + ") {/* <- zjs runtime */ " + rawModule + "\n})(" + nsVals.join(', ') + ");\n";
  return compiled;
};

z.parser = parser;