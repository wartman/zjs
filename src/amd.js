/**
 * Provides AMD compatability. Use exactly as you would with any other 
 * AMD system. This also allows z to import AMD modules natively.
 *
 * @param {String} name (optional)
 * @param {Array} reqs
 * @param {Fnction} factory
 */
root.define= function(name, reqs, factory){

  if(2 === arguments.length){
    factory = reqs;
    reqs = name;
    name = undefined;
  }

  if(1 === arguments.length){
    factory = name;
    reqs = [];
    name = undefined;
  }

  var mod = z(name);

  u.each(reqs, function(req){
    mod.imports(req.split('/').join('.'));
  });

  mod.exports(function(__){
    var args = [];
    for(var dep in __){
      args.push(__[dep]);
    }

    var noConflictExports = root.exports // save the exports func.
      , noConflictModule = root.module
      , result;

    root.exports = {}; // Allows the use of exports.
    root.module = {}; // Allows the use of module.exports
    result = factory.apply(this, args);

    if(false === u.isEmpty(root.exports)){
      result = root.exports;
    }

    if(root.module.exports){
      result = root.module.exports;
    }

    root.exports = noConflictExports;
    root.module = noConflictModule;

    return result;
  });

}

root.define.amd = {
  jQuery: true
}