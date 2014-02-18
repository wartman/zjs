(function(z, undefined){

  module('Events Test');

  test('on and trigger', function(){
    var obj = {
      counter: 0,
      events: z.events(obj)
    };

    obj.events.on('event', function(){ obj.counter++; });
    obj.events.trigger('event');
    equal(obj.counter, 1, 'Counter incremented');
    obj.events.trigger('event');
    obj.events.trigger('event');
    obj.events.trigger('event');
    obj.events.trigger('event');
    equal(obj.counter, 5, 'Counter incremented five times.');
  });

  test("off cleans up, notices context", function(){
    var obj = {
      counter: 0,
      events: z.events(obj)
    };

    obj.events.on('event', function(){ok(true);});
    obj.events.trigger('event');
    obj.events.off('event');
    equal(undefined === obj.events._events['event'], true);

    var increment = function(){obj.counter++}

    obj.events.on('a b', increment);
    obj.events.off('a', function(){ });
    obj.events.trigger('a b');
    equal(obj.counter, 2);
    obj.events.off('a', increment);
    equal(undefined === obj.events._events['a'], true);
    equal(undefined !== obj.events._events['b'], true);

  });

  test('Once', function(){
    var obj = {
      counter: 0,
      events: z.events(obj)
    };

    obj.events.once('event', function(){obj.counter++;});
    obj.events.trigger('event');
    equal(obj.counter, 1);
    obj.events.trigger('event');
    equal(obj.counter, 1, 'Counter only incremented once');

  });

  test("Binding and triggering multiple events", function(){
    var obj = {
      counter: 0,
      events: z.events(obj)
    };

    obj.events.on('a b c', function(){ obj.counter+= 1;});

    obj.events.trigger('a');
    equal(obj.counter, 1);

    obj.events.trigger('a b');
    equal(obj.counter, 3);

    obj.events.trigger('c');
    equal(obj.counter, 4);

    obj.events.off('a c');
    obj.events.trigger('a b c');
    equal(obj.counter, 5);
  });

  test("Binding and triggering with event maps.", function(){
    var obj = {
      counter: 0,
      events: z.events(obj)
    };
    var increment = function(){
      this.counter++;
    }

    obj.events.on({
      a: increment,
      b: increment,
      c: increment
    }, obj);

    obj.events.trigger('a');
    equal(obj.counter, 1);

    obj.events.trigger('a b');
    equal(obj.counter, 3);

    obj.events.trigger('c');
    equal(obj.counter, 4);

    obj.events.off({
      a: increment,
      b: increment
    }, obj);
    obj.events.trigger('a b c');
    equal(obj.counter, 5);
  });

  test("listenTo and stopListening", function(){
    var a = {
      events: z.events(a)
    };
    var b = {
      events: z.events(b)
    };
    a.events.listenTo(b.events, 'all', function(){ ok(true); } );
    b.events.trigger('anything');
    a.events.listenTo(b.events, 'all', function(){ ok(false); });
    a.events.stopListening();
    b.events.trigger('anything');
  });

  // To do: test once, more tests for listenTo
  // See https://github.com/jashkenas/backbone/blob/master/test/events.js (the backbone tests)
  // for examples of where to take this.

})(window.z || {});