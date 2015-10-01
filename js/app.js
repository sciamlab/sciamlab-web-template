// this is to auto-collapse the menu on mobile
$(document).on('click','.nav a',function(e) {
    $(".navbar-toggle").click();
});

angular.module('SciamlabWebTemplate', ['ui.router','ui.bootstrap','LocalStorageModule'])
.config(['$locationProvider','localStorageServiceProvider','$urlRouterProvider','$httpProvider','$stateProvider','config',
     function($locationProvider,localStorageServiceProvider,$urlRouterProvider,$httpProvider,$stateProvider,config,
          $stateHelperProvider,$rootScope,$state,$auth,$log) {
         
    localStorageServiceProvider
        .setPrefix(config.localStoragePrefix)
        .setStorageType('localStorage')
        .setNotify(true, true)
    
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    
    $stateProvider
    .state('home',{url: "/", templateUrl: "templates/home.html", css:"css/style.css", controller: "homeController"})
    .state('404',{url: "/404", templateUrl: "templates/404.html", css:"css/style.css"})
    .state('login', {
        url: "/login", 
        templateUrl: "templates/login.html", 
        css:"css/style.css", 
        controller: "loginController",
        resolve: {
            auth: function($rootScope,$q) {
                return $rootScope.checkUser();
            }
        }
    })
    .state('signup', {
        url: "/signup", 
        templateUrl: "templates/signup.html", 
        css:"css/style.css", 
        controller: "signupController",
        resolve: {
            auth: function($rootScope,$q) {
                return $rootScope.checkUser();
            }
        }
    })
    .state('reset', {
        url: "/reset", 
        templateUrl: "templates/reset.html", 
        css:"css/style.css", 
        controller: "resetController",
        resolve: {
            auth: function($rootScope,$q) {
                return $rootScope.checkUser();
            }
        }
    })
    .state('logout', {url: "/logout", template: null, controller: "logoutController"})
    .state('profile', {
        url: '/profile',
        templateUrl: 'templates/profile.html',
        css:"css/style.css",
        controller: 'profileController',
        resolve: {
            auth: function($auth,$rootScope) {
                return $auth.validate()
                    .success(function(data, status, headers, config) {
                        $rootScope.$broadcast('auth:validate-success', data);
                    })
                    .error(function(data, status, headers, config) {
                        $rootScope.$broadcast('auth:validate-error', data);
                    });
            }
        }
    })
    .state('admin', {
        url: '/admin',
        templateUrl: 'templates/admin.html',
        css:"css/style.css",
        controller: 'adminController',
        resolve: {
            auth: function($auth,$rootScope) {
                return $auth.validate()
                    .success(function(data, status, headers, config) {
                        $rootScope.$broadcast('auth:check-role', {role:'admin', user:data});
                    })
                    .error(function(data, status, headers, config) {
                        $rootScope.$broadcast('auth:validate-error', data);
                    });
            }
        }
    })
    ;
             
    $urlRouterProvider.otherwise('/404');

    // FIX for trailing slashes. Gracefully "borrowed" from https://github.com/angular-ui/ui-router/issues/50
    $urlRouterProvider.rule(function($injector, $location) {
        if($location.protocol() === 'file')
            return;

        var path = $location.path()
        // Note: misnomer. This returns a query object, not a search string
            , search = $location.search()
            , params
            ;

        // check to see if the path already ends in '/'
        if (path[path.length - 1] === '/') {
            return;
        }

        // If there was no search string / query params, return with a `/`
        if (Object.keys(search).length === 0) {
            return path + '/';
        }

        // Otherwise build the search string and return a `/?` prefix
        params = [];
        angular.forEach(search, function(v, k){
            params.push(k + '=' + v);
        });
        return path + '/?' + params.join('&');
    });

    //$locationProvider.html5Mode(true);

    /*$httpProvider.interceptors.push(function($q, $location) {
        return {
            'responseError': function(response) {
                if(response.status === 401 || response.status === 403) {
                    $state.go('login');
                }
                return $q.reject(response);
            }
        };
    });*/
               
}])
.run(function($rootScope, $http, $state, localStorageService, $auth, $q, $log) {
    console.log('app init...');

    $rootScope.year = new Date().getFullYear();
    $rootScope.user = null;
    
    $log.log("localStorageService.isSupported : "+localStorageService.isSupported);
    $log.log("localStorageService.getStorageType() : "+localStorageService.getStorageType());
    $log.log("localStorageService.keys() : "+localStorageService.keys())
    $log.log('[done]');
     
    $state.go('home');
    
    $rootScope.isAuthenticated = function(){
        return localStorageService.get('user')!=null;  
    };
    $rootScope.isUserInRole = function(role){
        return $rootScope.getUser().roles.indexOf(role) != -1;
    };
    $rootScope.getUser = function(){
        return localStorageService.get('user');  
    };
    $rootScope.isSocial = function(){
        return localStorageService.get('user')!=undefined && localStorageService.get('user').social_details!=undefined;  
    };
    $rootScope.getToken = function(){
        return localStorageService.get('token');  
    };
    $rootScope.checkUser = function(){
        var deferred = $q.defer();
        deferred.resolve($rootScope.isAuthenticated());
        return deferred.promise
            .then(function(authenticated, status, headers, config) {
                if(authenticated)
                    $rootScope.$broadcast('auth:already-authenticated', $rootScope.getUser());
            });
    }
    $rootScope.$on('auth:already-authenticated', function(ev, data) {
        $log.warn('user already authenticated');
        $state.go('profile');
    });
    $rootScope.$on('auth:validate-success', function(ev, data) {
        localStorageService.set('user', data.user);
        $log.debug('user session validated');
    });
    $rootScope.$on('auth:check-role', function(ev, data) {
        if($rootScope.isUserInRole(data.role)){
            $log.debug('OK for you to access that restricted page :)');
            $rootScope.$broadcast('auth:validate-success', data.user);
        }else{
            $log.warn('user not authorized to view that page!');    
            $state.go('home');
        }
    });
    $rootScope.$on('auth:validate-error', function(ev, data) {
        localStorageService.clearAll();
        $log.debug('user session successfully cleaned');
        $state.go('login');
    });
    $rootScope.$on('auth:login-success', function(ev, data) {
        localStorageService.set('user', data.user);
        localStorageService.set('token', data.token);
        $state.go('profile');
    });
    $rootScope.$on('auth:signup-success', function(ev, data) {
        localStorageService.set('user', data.user);
        localStorageService.set('token', data.token);
        $state.go('profile');
    });
    $rootScope.$on('auth:logout-success', function(ev, data) {
        localStorageService.clearAll();
        $log.debug('user session successfully cleaned');
        $state.go('login');
    });
    $rootScope.$on('auth:logout-error', function(ev, data) {
        localStorageService.clearAll();
        $log.debug('user session successfully cleaned');
        $state.go('home');
    });
    $rootScope.$on('auth:delete-success', function(ev, data) {
        localStorageService.clearAll();
        $log.debug('user session successfully cleaned');
        $state.go('login');
    });
    $rootScope.$on('auth:reset-success', function(ev, data) {
        $state.go('login');
    });
    
    
    
    
})

;

