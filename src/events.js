  /**
   * ----------------------------------------------------------------------
   * z.events
   *
   * Fit's event system.
   * Based heavily on backbone.
   */

  var eventsSeparator = /\s+/;

  /**
   * Handles space seperated events and event-maps
   *
   * @param {Object} obj
   * @param {String || Object} name Either pass an event-name, an
   *   event-map object (eg: {'foo': function(){code}, etc. } )
   *   or a space separated list of events (eg: 'foo bar baz')
   * @param {Function} callback
   * @param {Object} context
   * @return {Bool} True if the API is handling, false if the calling 
   *   function should handle.
   */
  var eventsApi = function(obj, action, name, rest){
    if(!name){
      return true;
    }

    if(typeof name === 'object'){
      for(var key in name){
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    if(eventsSeparator.test(name)){
      var names = name.split(eventsSeparator);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  }

  /**
   * Efficient events dispatcher (based on backbone)
   *
   */
  var eventsDispatcher = function(events, args){
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  }  

  /**
   * Handles binding and running of events.
   *
   * @package z.events
   * @api Private
   */
  var Events = z.Class({

    __init__: function(context){
      this._context = (context || this);
      this._listeningTo = {};
      this._listenerId = z.util.uniqueId('L')
      this._events = {};
    },

    on: function(name, callback, context){
      if(!eventsApi(this, 'on', name, [callback, context]) || !callback){
        return this;
      }
      var events = this._events[name] || (this._events[name] = []);
      events.push({
        name: name,
        callback: callback,
        context: context,
        ctx: (context || this._context)
      });
      return this;
    },

    once: function(name, callback, context){
      if(!eventsApi(this, 'once', name, [callback, context]) || !callback){
        return this;
      }
      var self = this
        , once = z.util.once(function(){
            self.off(name, once);
            callback.apply(this.arguments);
          })
        ;
      once._callback = callback;
      return this.on(name, once, context);
    },

    off: function(name, callback, context){
      if(!eventsApi(this, 'off', name, [callback, context])){
        return this;
      }
      if(!name && !callback && !context){
        // If no args, clear all events.
        this._events = {};
        return this;
      }

      // If {name} is not passed, go through all events and disable them
      // if they match {callback} or {context}.
      var names = name ? [name] : Object.keys(this._events)
        ;

      for(var i = 0; i < names.length; i++){
        var name = names[i]
          , events = this._events[name]
          , ev, retain
          ;

        if(events){
          this._events[name] = retain = [];

          if(callback || context){

            for(var j =0; j < events.length; j++){
              ev = events[j];

              if(
                (callback && callback !== ev.callback && callback !== callback._callback)
                || (context && context !== ev.context)
              ){
                retain.push(ev);
              }
            }
          }

          if (0 >= retain.length){
            delete this._events[name];
          }

        }
      }
    },

    listenTo: function(obj, name, callback){
      if(false === obj instanceof Events){
        throw new TypeError('{obj} must be instance of {Events}');
        return this;
      }
      this._listeningTo[obj._listenerId] = obj;
      if(!callback && typeof name === 'object'){
        callback = this._context;
      }
      obj.on(name, callback, this._context);
      return this;
    },

    stopListening: function(obj, name, callback, context){
      var listeningTo = this._listeningTo
        , remove
        ;

      if(!listeningTo){
        return this;
      }

      remove = !name && !callback;

      if(!callback && typeof name === 'object'){
        callback = this;
      }

      listeningTo = (obj)? (listeningTo={})[obj._listenerId] = obj : listeningTo;

      for(var id in listeningTo){
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if(remove || z.util.empty(obj._events)){
          delete this._listeningTo[id];
        }
      }

    },

    trigger: function(name){
      if(!this._events){
        return this;
      }

      var args = slice.call(arguments, 1)
        , events, allEvents
        ;

      if(!eventsApi(this, 'trigger', name, args)){
        return this;
      }

      events = this._events[name];
      allEvents = this._events.all;

      if(events){
        eventsDispatcher(events, args);
      }
      if(allEvents){
        // The first argument of an 'all' event is always the
        // name of the triggered event.
        eventsDispatcher(allEvents, arguments);
      }

      return this;
    }

  });

  /**
   * Events API
   *
   * @return {Events}
   */
  z.events = function(context){
    return new Events(context);
  }
