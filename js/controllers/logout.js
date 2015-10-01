angular.module('SciamlabWebTemplate')
.controller("logoutController", function($scope, $http, $rootScope, localStorageService, $auth) {
    $scope.$parent.active='logout';
    console.log('logout controller');

    if($rootScope.google){
        console.log('revoke');
        var revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' + $scope.google['access_token'];
        console.log(revokeUrl);

        $http({
            type: 'GET',
            url: revokeUrl,
            async: false,
            contentType: "application/json",
            dataType: 'jsonp',
            success: function(nullResponse) {
                $rootScope.$broadcast('auth:logout-success', null);
                // Do something now that user is disconnected
                // The response is always undefined.
                //$scope.login_status = 'disconnected'
                //$scope.$apply();
            },
            error: function(e) {
                console.log('error in revoke');
                // Handle the error
                console.log(e);
                // You could point users to manually disconnect if unsuccessful
                // https://plus.google.com/apps
            }
        }); 
    }else if($rootScope.facebook){
        FB.logout(function(response) {
            $rootScope.$apply(function() { 
                $rootScope.user = {}; 
            }); 
        });
    }else{
        $auth.logout()
            .success(function(data, status, headers, config) {
                $rootScope.$broadcast('auth:logout-success', data);
            })
            .error(function(data, status, headers, config) {
                $rootScope.$broadcast('auth:logout-error', data);
            });
    }
    
})
;