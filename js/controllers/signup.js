angular.module('SciamlabWebTemplate')
.controller("signupController", function($scope, $http, $rootScope, $state, localStorageService, $auth) {
    $scope.$parent.active='signup';
    console.log('signup controller');
    
    $scope.submitSignup = function(form){
        $auth.signup(form)
            .success(function(data, status, headers, config) {
                $rootScope.$broadcast('auth:signup-success', data);
            })
            .error(function(data, status, headers, config) {
                $rootScope.$broadcast('auth:signup-error', data);
            });
    };
    
    $rootScope.$on('auth:signup-error', function(ev, data) {
        $scope.error = data;
    });
})
;