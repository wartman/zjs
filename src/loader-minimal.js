// Loader
// ------
// For minimal builds. Doesn't actually load modules.
var Loader = function () {
  this._visited = {}; 
};

// Get a visit if one exists
Loader.prototype.getVisit = function(pathName) {
  return this._visited[pathName];
};

// Add a visit
Loader.prototype.addVisit = function(pathName, cb) {
  this._visited[pathName] = true;
  return this;
};

Loader.prototype.load = function(pathName, next) {
  var _this = this;
  if (this.getVisit(pathName)) {
    next(null);
    return this;
  }
  next(new Error('Module not found:' + pathName));
  return this;
};
