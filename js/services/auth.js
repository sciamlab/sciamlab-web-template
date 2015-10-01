angular.module('SciamlabWebTemplate')
.factory('$auth', function(config, $http, localStorageService) {
    
    var auth = {};

    auth.login = function(data){
        return $http({
            method:'POST',
            url: config.api+'/user/login',
            data: data,
            responseType:'json'
        });
    };
    
    auth.logout = function(){
        return $http({
            method:'GET',
            headers: {
                'Authorization': localStorageService.get('token')
            },
            url: config.api+'/user/logout',
            responseType:'json'
        });
    };
    
    auth.foo = function(){
        console.log('foo');
        var defer = $q.defer();
        $timeout(function () {
            defer.resolve(); 
          }, 2000);
        return defer.promise;
    };
    
    auth.signup = function(data){
        return $http({
            method:'POST',
            url: config.api+'/user/signup',
            data: data,
            responseType:'json'
        });
    };
    
    auth.validate = function(){
        return $http({
            method:'GET',
            headers: {
                'Authorization': localStorageService.get('token')
            },
            url: config.api+'/user/validate',
            responseType:'json'
        });
    };
    
    auth.delete = function(data){
        return $http({
            method:'POST',
            headers: {
                'Authorization': localStorageService.get('token')
            },
            url: config.api+'/user/delete',
            data: data,
            responseType:'json'
        });
    };
    
    auth.update = function(data){
        return $http({
            method:'PUT',
            headers: {
                'Authorization': localStorageService.get('token')
            },
            url: config.api+'/user/update',
            data: data,
            responseType:'json'
        });
    };
    
    auth.reset = function(data){
        return $http({
            method:'POST',
            url: config.api+'/user/reset',
            data: data,
            responseType:'json'
        });
    };
    
    auth.social = function(provider, data){
        console.log(config.api+'/social/' + provider);
        return $http({
            method:'POST',
            url: config.api+'/social/' + provider,
            data: data,
            responseType:'json'
        });
    };
    
    auth.social_token = function(provider){
        console.log(config.api+'/social/' + provider + '/token');
        return $http({
            method:'GET',
            url: config.api+'/social/' + provider + '/token',
            responseType:'json'
        });
    };
    
    return auth;
});