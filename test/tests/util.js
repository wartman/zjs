(function(z, undefined){

  module('Util Test')

  var util = z.util;

  test('z.util.each', function(){

    var test = ['1', '2', '3', '4'];

    var expected = "1, 2, 3, 4, ";
    var actual = ""

    z.util.each(test, function(item){
      actual += item + ", "
    });

    equal(actual, expected, 'Iterated over an array');

    test = {
      one: '1',
      two: '2',
      three: '3',
      four: '4'
    };

    expected = "one:1, two:2, three:3, four:4, ";
    actual = ""

    z.util.each(test, function(value, key){
      actual += key+":"+value+", ";
    });

    equal(actual, expected, 'Iterated over an object');

  });

  test('z.util.each oop', function(){

    var test = ['1', '2', '3', '4'];

    var expected = "1, 2, 3, 4, ";
    var actual = ""

    z.util(test).each(function(item){
      actual += item + ", "
    });

    equal(actual, expected, 'Iterated over an array');

    test = {
      one: '1',
      two: '2',
      three: '3',
      four: '4'
    };

    expected = "one:1, two:2, three:3, four:4, ";
    actual = ""

    z.util(test).each(function(value, key){
      actual += key+":"+value+", ";
    });

    equal(actual, expected, 'Iterated over an object');

  });

  test('z.util.once', function(){
    var inc = 0;
    var once = z.util.once(function(){
      return inc += 1;
    });

    equal(once(), 1, 'Ran once.');
    equal(once(), 1, 'And only once.');

  });

  test('z.util.once oop', function(){
    var inc = 0;
    var once = z.util(function(){
      return inc += 1;
    }).once().value();

    equal(once(), 1, 'Ran once.');
    equal(once(), 1, 'And only once.');

  });

  test('z.util.isEmpty', function(){

    ok(z.util.isEmpty([]));
    ok(z.util.isEmpty({}));
    ok(z.util.isEmpty(""));
    equal(z.util.isEmpty([1,2]), false);
    equal(z.util.isEmpty({a:1,b:2}), false);
    equal(z.util.isEmpty('one'), false);

  });

  test('z.util.isEmpty oop', function(){

    ok(z.util([]).isEmpty().value());
    ok(z.util({}).isEmpty().value());
    ok(z.util("").isEmpty().value());
    equal(z.util([1,2]).isEmpty().value(), false);
    equal(z.util({a:1,b:2}).isEmpty().value(), false);
    equal(z.util('one').isEmpty().value(), false);

  });

  test('z.util.clone', function(){

    var expected = {
      'one' : '1',
      'two' : '2',
      'three': {
        'four': '4',
        'five': '5'
      }
    };

    var actual = util.clone(expected);

    deepEqual(actual, expected, 'Does the clone create a clone of the object?');

    actual['one'] = '2';

    notDeepEqual(actual, expected, 'Does the cloned object not modify the original?');

  });

  test('z.util.clone oop', function(){

    var expected = {
      'one' : '1',
      'two' : '2',
      'three': {
        'four': '4',
        'five': '5'
      }
    };

    var actual = z.util(expected).clone().value();

    deepEqual(actual, expected, 'Does the clone create a clone of the object?');

    actual['one'] = '2';

    notDeepEqual(actual, expected, 'Does the cloned object not modify the original?');

  });

  test('z.util.defaults', function(){

    var defaults = {
      'option': 'value',
      'optionTwo': 'value'
    }

    var expected = {
      'option' : 'not',
      'optionTwo': 'value'
    };

    var actual = z.util.defaults(defaults, {'option': 'not'});

    deepEqual(actual, expected, 'Are default options preserved?');
    notDeepEqual(actual, defaults, 'Is the default object not changed?');

    actual = z.util.defaults({}, expected);
    deepEqual(actual, expected, 'Does extending a blank object work?');

    actual = z.util.defaults(expected, undefined);
    deepEqual(actual, expected, 'Does an undefined second arg work?');

    actual = z.util.defaults(expected, {});
    deepEqual(actual, expected, 'Does an empty second arg work?');

  });

  test('z.util.defaults oop', function(){

    var defaults = {
      'option': 'value',
      'optionTwo': 'value'
    };

    var expected = {
      'option' : 'not',
      'optionTwo': 'value'
    };

    var actual = z.util(defaults).defaults({'option': 'not'}).value();

    deepEqual(actual, expected, 'Are default options preserved?');
    notDeepEqual(actual, defaults, 'Is the default object not changed?');

    actual = z.util({}).defaults(expected).value();
    deepEqual(actual, expected, 'Does extending a blank object work?');

    actual = z.util(expected).defaults(undefined).value();
    deepEqual(actual, expected, 'Does an undefined second arg work?');

    actual = z.util(expected).defaults({}).value();
    deepEqual(actual, expected, 'Does an empty second arg work?');

  });

  test('z.util.uniqueId', function(){

    // Reset the id index as it may have been called.
    var retain = util._idIndex;
    util._idIndex = 0;
    equal(util.uniqueId('test'), 'test1', 'Is the id generated?');
    equal(util.uniqueId('test'), 'test2', 'Deos the id iterate upwards?');
    util._idIndex = retain;

  });

  test('z.util.uniqueId oop', function(){

    // Reset the id index as it may have been called.
    var retain = util._idIndex;
    util._idIndex = 0;
    equal(util('test').uniqueId().value(), 'test1', 'Is the id generated?');
    equal(util('test').uniqueId().value(), 'test2', 'Deos the id iterate upwards?');
    util._idIndex = retain;

  });

  test('z.util.Iterator', function(){
    var data = [1,2,3,4,5,6]
      , iterator = new z.util.Iterator(data)
      ;
    
    equal(iterator.current(), 1, 'Does current return the current item?');

    iterator.next();
    equal(iterator.current(), 2, 'Does next load the next item?');

    iterator.prev();
    equal(iterator.current(), 1, 'Does prev load the previous item?');

    iterator.next();
    iterator.next();
    iterator.rewind();
    equal(iterator.current(), 1, 'Does rewind return to the first item?');

    iterator.currentIndex = 10;
    equal(iterator.valid(), false, 'Does valid return false if the iterator does not have an item?');
    iterator.currentIndex = 5; // remember: arrays start at zero.
    equal(iterator.valid(), true, 'Does valid return true if the iterator has an item?');

    var actual = "0";
    var expected = "0, 1, 2, 3, 4, 5, 6";
    iterator.each(function(item){
      actual += ', '+ item;
    });
    equal(actual, expected, 'Does each iterate over all objects?');

    iterator.last();
    equal(iterator.current(), 6, 'Does last really return the last item?');

    iterator.last();
    ok(iterator.atLast(), 'is on last item');
    iterator.rewind();
    ok(iterator.atFirst(), 'is on first item');
    iterator.currentIndex = 3;
    ok(iterator.at(3), 'is on third item');
    iterator.next();
    ok(iterator.at(4), 'is on fourth item');

    iterator.push(7);
    iterator.last();
    console.log(iterator.currentIndex, iterator.data, iterator.current());
    equal(iterator.current(), 7, 'items can be pushed');
    equal(iterator.length, 7, 'length updates');
    iterator.pop();
    equal(iterator.length, 6, 'items can be popped.')

  });

  test("util.extract", function(){

    var expected = {
      one: "one",
      three: "three"
    };

    var test = {
      one: "one",
      two: "two",
      three: "three"
    };

    var actual = z.util.extract(['one', 'three'], test);

    deepEqual(actual, expected, 'Properties were extracted.');
    deepEqual(test, {two:'two'}, 'Properties removed from the original.');

    test = {
      one: "one",
      three: "three"
    };
    actual = {};

    z.util.extract(['one', 'two'], test, actual);
    deepEqual(actual, {one: "one"}, 'Applied props to provided object, skipped non-existant prop.');

    test = {
      one: "one",
      two: {
        one: "one"
      }
    };

    actual = {
      two: {
        two: "two"
      }
    };

    z.util.extract(['one', 'two'], test, actual);
    deepEqual(actual, {one:"one", two:{one:"one", two:"two"}}, "Applied args to provided object, retained existing props.");

  });

  test('util oop chaining', function(){

    var actual = z.u(['one', 'two']).isArray();
    ok(actual.value());

  });

})(window.z || {});