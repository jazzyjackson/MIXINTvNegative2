// some global helper functions that don't really fit within more specific encapsulations


function makeIterator(array) {
    var nextIndex = 0;
    return {
       next: function() {
           return nextIndex < array.length ?
               {value: array[nextIndex++], done: false} :
               {done: true};
       }
    };
}

const me = "I cant change"