/**
 * Progress logger for build.
 */

var u = require('./util');

var Progress = {

  _args: function(prepend, args){
    var args = Array.prototype.slice.call(args);
    args.unshift(prepend);

    return args;
  },

  title: function(title){
    console.log('\n\x1B[1m   ' + title + '\x1B[22m');
  },

  done: function(){
    console.log.apply(console, this._args('✔ ', arguments));
  },

  ok: function(){
    console.log.apply(console, this._args('• ', arguments));
  },

  error: function(){
    console.log.apply(console, this._args('✖ ', arguments));
  },

  log: function(){
    console.log.apply(console, arguments);
  }

};

module.exports = Progress;