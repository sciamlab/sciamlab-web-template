angular.module('SciamlabWebTemplate')
.controller("profileController", function($scope, $http, $rootScope, $state, localStorageService, $auth, auth, $modal, $log) {
    $scope.$parent.active='profile';
    console.log('profile controller');
    
    $scope.user = localStorageService.get('user');
    
    $scope.updateProfile = function(){
        $auth.update($scope.user)
            .success(function(data, status, headers, config) {
                $rootScope.$broadcast('auth:update-success', data);
            })
            .error(function(data, status, headers, config) {
                $rootScope.$broadcast('auth:update-error', data);
            });
    };
    
    $rootScope.$on('auth:update-success', function(ev, data) {
        localStorageService.set('user', data.user);
        $scope.user = localStorageService.get('user');
        $scope.success = "User updated";
    });
    
    $rootScope.$on('auth:update-error', function(ev, data) {
        $scope.error = data;
    });
    
    
    
    /*$scope.deleteProfile = function(){
        $auth.delete($scope.user)
        .success(function(data, status, headers, config) {
            $rootScope.$broadcast('auth:delete-success', data);
        })
        .error(function(data, status, headers, config) {
            $rootScope.$broadcast('auth:delete-error', data);
        });
    };*/
    
    $rootScope.$on('auth:delete-error', function(ev, data) {
        $scope.error_delete = data;
    });
    
    $scope.modalDelete = function () {
        var modalInstance = $modal.open({
            templateUrl: 'modal-delete.html',
            controller: 'profileDeleteController'
        });

        modalInstance.result.then(
            function () {
                $auth.delete($scope.user)
                .success(function(data, status, headers, config) {
                    $rootScope.$broadcast('auth:delete-success', data);
                })
                .error(function(data, status, headers, config) {
                    $rootScope.$broadcast('auth:delete-error', data);
                });
            }
            /*, function () { $log.debug('Modal dismissed at: ' + new Date()); }*/
        );
    };
    
}).controller('profileDeleteController', function ($scope, $modalInstance, $log) {

    $scope.delete = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss();
    };
})
;