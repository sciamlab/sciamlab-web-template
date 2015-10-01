angular.module('SciamlabWebTemplate')
.filter('iif', function () {
    // {{condition | iif : "if true" : "if false"}}
   return function(input, trueValue, falseValue) {
        return input ? trueValue : falseValue;
   };
});