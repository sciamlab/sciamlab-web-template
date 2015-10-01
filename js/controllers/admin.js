angular.module('SciamlabWebTemplate')
.controller("adminController", function($scope, $http) {
    $scope.$parent.active='admin';
    console.log('admin controller');
    
})
;