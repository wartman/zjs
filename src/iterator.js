  /**
   * A simple iterator class.
   *
   * @package z.util
   */
  z.util.Iterator = z.Class({

    /**
     * Initilize.
     *
     * @param {Array} data An array of data to iterate over.
     */
    __init__:function(data){
      this.data = data || [];
      this.currentIndex = 0;
      this.length = this.data.length;
    },

    push: function(item){
      this.data.push(item);
      this.length = this.data.length;
      return this;
    },

    pop: function(item){
      this.data.pop(item);
      this.length = this.data.length;
      return this;
    },

    indexOf: function(item){
      return this.data.indexOf(item);
    },

    has: function(item){
      return this.indexOf(item);
    },

    atFirst: function(){
      return this.currentIndex === 0;
    },

    atLast: function(){
      return this.currentIndex >= (this.length -1);
    },

    at: function(position){
      return this.currentIndex === position;
    },
    
    next: function(){
      this.currentIndex++;
    },

    prev: function(){
      this.currentIndex--;
    },

    last: function(){
      this.currentIndex = (this.data.length - 1);
    },

    valid: function(){
      if(this.currentIndex < this.data.length
        && this.currentIndex >= 0){
        return true;
      }
      return false;
    },

    rewind: function(){
      this.currentIndex = 0;
    },

    current: function(){
      return this.data[this.currentIndex];
    },

    each: function(callback){
      if(typeof callback !== 'function'){
        return;
      }
      this.rewind();
      while(this.valid()){
        if(callback(this.current(), this)){
          break; // break when returns true.
        }
        this.next();
      }
      this.rewind();
    }

  });