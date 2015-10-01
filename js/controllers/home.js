angular.module('SciamlabWebTemplate')
.controller("homeController", function($scope, $http) {
    $scope.$parent.active='home';
    console.log('home controller');
    
})
;