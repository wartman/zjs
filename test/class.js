(function(){

  module('z Class');

  test("Creating", function(){

    var Actual = z.Class({
      __init__: function(){
        ok(true);
      },
      test: function(){
        return "done";
      }
    });

    var Expected = function(){
      this.__init__.apply(this, arguments);
    }
    Expected.prototype = {
      __init__: function(){
        ok(true);
      },
      test: function(){
        return "done";
      }
    }

    var ActualInstance = new Actual();
    var ExpectedInstance = new Expected();

    equal(ActualInstance.test(), ExpectedInstance.test(), "Do methods work as expected?");

  });

  test("Extending", function(){

    var Base = z.Class({
      __init__: function(){
        this.testString = "parent";
      },
      test: function(){
        return this.testString;
      }
    });

    var Child = Base.extend({
      test: function(){
        return this.testString + "Childed";
      }
    });

    var actual = new Child;

    equal(actual.test(), "parentChilded", "Class extended using Parent.extend(props) method.");

    var ChildNew = z.Class(Base, {
      test: function(){
        return this.testString + "Childed";
      }
    });

    actual = new ChildNew;

    equal(actual.test(), "parentChilded", "Class extended using Class(parent, props) method");

  });

  test("__init__", function(){

    var Base = z.Class({
      __init__: function(){
        this.initilized = "yep"
      }
    });

    var actual = new Base;

    equal(actual.initilized, "yep", '__init__ was called');

    var Child = Base.extend({});

    actual = new Child;

    equal(actual.initilized, "yep", '__init__ was called on child');

  });

  test('__super__', function(){

    var Par = z.Class({

      name: 'Fred',

      test: function(what){
        return this.name + ' is ' + what;
      }

    });

    var Chi = Par.extend({

      name: 'Ned',

      test: function(){
        return this.__super__('Ok');
      }

    });

    var actual = new Chi();

    equal(actual.test(), 'Ned is Ok', "Super called.");

  });

  test("__new__", function(){

    var Base = z.Class({
      __new__: function(){
        this.isNew = "new";
        this.__init__.apply(this, arguments);
      },
      __init__: function(){
        this.initilized = "yep"
      }
    });

    var actual = new Base;

    equal(actual.isNew, 'new', "__new__ called");

    var Child = Base.extend({});

    actual = new Child;

    equal(actual.isNew, 'new', "__new__ called in child");

  });

  test("instanceof", function(){

    var Foo = z.Class({
      __init__: function(){
        this.bar = "bar";
      }
    });

    var foo = new Foo;

    ok(foo instanceof Foo, "Instance works as expected.");

    var Bar = Foo.extend({
      bar: function(){
        this.bar = "foo";
      }
    });

    var bar = new Bar;

    ok(bar instanceof Bar, "Extended class detects intance.");

  });

})();