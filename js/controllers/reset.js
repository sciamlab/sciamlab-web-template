angular.module('SciamlabWebTemplate')
.controller("resetController", function($scope, $http, $rootScope, $state, localStorageService, $auth) {
    $scope.$parent.active='reset';
    console.log('reset controller');

    $scope.submitReset = function(form){
        $auth.reset(form)
            .success(function(data, status, headers, config) {
                $rootScope.$broadcast('auth:reset-success', data);
            })
            .error(function(data, status, headers, config) {
                $rootScope.$broadcast('auth:reset-error', data);
            });
    };
    
    $rootScope.$on('auth:reset-error', function(ev, data) {
        $scope.error = data;
    });
})
;