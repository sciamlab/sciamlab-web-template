/*function google_plus_sign_in_render() {
    angular.element($('#btn-google')).scope().render();
}*/

angular.module('SciamlabWebTemplate')
.controller("loginController", 
            function($scope, $http, $rootScope, $state, localStorageService, $auth, $window, authConfig, config, $log, $q, $interval, $window, $location) {
    $scope.$parent.active='login';
    $log.log('login controller');
    
    
    $scope.submitLogin = function(form){
        $auth.login(form)
            .success(function(data, status, headers, config) {
            $log.log(data.user);
                $rootScope.$broadcast('auth:login-success', data);
            })
            .error(function(data, status, headers, config) {
                $rootScope.$broadcast('auth:login-error', data);
            });
    };
    
    $rootScope.$on('auth:login-error', function(ev, data) {
        $scope.error = data;
    });
    
    
    
    
    /*
     * START SOCIAL LOGIN
     */
    $scope.authenticate = function(provider) {
        authenticate(provider, false)
        .then(function(data) {
            $log.log(data.user);
            $rootScope.$broadcast('auth:login-success', data);
        })
        .catch(function(data) {
            $rootScope.$broadcast('auth:login-error', data);
        });
    };
    
    var authenticate = function(name, redirect, userData) {
        var provider = authConfig.providers[name].type === '1.0' ? new oauth1() : new oauth2();
        var deferred = $q.defer();
        provider.open(authConfig.providers[name], userData || {})
        .then(function(response) {
            deferred.resolve(response.data);
        })
        .catch(function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };
    
    function oauth2() {
        $log.log('oauth2');
        var defaults = {
            url: null,
            name: null,
            state: null,
            scope: null,
            scopeDelimiter: null,
            clientId: null,
            redirectUri: null,
            popupOptions: null,
            authorizationEndpoint: null,
            responseParams: null,
            requiredUrlParams: null,
            optionalUrlParams: null,
            defaultUrlParams: ['response_type', 'client_id', 'redirect_uri'],
            responseType: 'code'
        };
        var oauth2 = {};
        oauth2.open = function(options, userData) {
            angular.extend(defaults, options);
            angular.extend(defaults, {redirectUri: config.redirectUri});
            /*var stateName = defaults.name + '_state';
            if (angular.isFunction(defaults.state)) {
              storage.set(stateName, defaults.state());
            } else if (angular.isString(defaults.state)) {
              storage.set(stateName, defaults.state);
            }*/
            var url = defaults.authorizationEndpoint + '?' + oauth2.buildQueryString();
            return new popup().open(url, defaults.popupOptions, defaults.redirectUri)
                .then(function(oauthData) {
                    /*if (defaults.responseType === 'token') {
                        return oauthData;
                    }
                    if (oauthData.state && oauthData.state !== storage.get(stateName)) {
                        return $q.reject('OAuth 2.0 state parameter mismatch.');
                    }
                    return oauth2.exchangeForToken(oauthData, userData);*/
                    $log.log(defaults.name);
                    return $auth.social(defaults.name, oauthData);
                });
        };

        oauth2.buildQueryString = function() {
            var keyValuePairs = [];
            var urlParams = ['defaultUrlParams', 'requiredUrlParams', 'optionalUrlParams'];
            angular.forEach(urlParams, function(params) {
                angular.forEach(defaults[params], function(paramName) {
                    var camelizedName = camelCase(paramName);
                    var paramValue = defaults[camelizedName];
                    if (paramName === 'state') {
                        var stateName = defaults.name + '_state';
                        paramValue = encodeURIComponent(storage.get(stateName));
                    }
                    if (paramName === 'scope' && Array.isArray(paramValue)) {
                        paramValue = paramValue.join(defaults.scopeDelimiter);
                        if (defaults.scopePrefix) {
                            paramValue = [defaults.scopePrefix, paramValue].join(defaults.scopeDelimiter);
                        }
                    }
                    keyValuePairs.push([paramName, paramValue]);
                });
            });
            return keyValuePairs.map(function(pair) {
                    return pair.join('=');
                }).join('&');
        };
        return oauth2;
    };
      
    function oauth1() {
        $log.log('oauth1');
        var defaults = {
            url: null,
            name: null,
            popupOptions: null,
            redirectUri: null
        };
        var oauth1 = {};
        oauth1.open = function(options, userData) {
            angular.extend(defaults, options);
            angular.extend(defaults, {redirectUri: config.redirectUri});
            return new popup().open(config.api + defaults.authorizationEndpoint, defaults.popupOptions, defaults.redirectUri)
                .then(function(oauthData) {
                    $log.log(defaults.name);
                    return $auth.social(defaults.name, oauthData);
                });
        };

        return oauth1;
    };
    
    
    
    
    
   
    
    function popup() {
        var popupWindow = null;
        var polling = null;

        var popup = {};

        popup.popupWindow = popupWindow;

        popup.open = function(url, options, redirectUri) {
            var optionsString = popup.stringifyOptions(popup.prepareOptions(options || {}));
            popupWindow = window.open(url, '_blank', optionsString);
            if (popupWindow && popupWindow.focus) {
                popupWindow.focus();
            }
            if (authConfig.platform === 'mobile') {
                return popup.eventListener(redirectUri);
            }
            return popup.pollPopup();
        };

        popup.eventListener = function(redirectUri) {
            var deferred = $q.defer();
            popupWindow.addEventListener('loadstart', function(event) {
                if (event.url.indexOf(redirectUri) !== 0) {
                    return;
                }
                var parser = document.createElement('a');
                parser.href = event.url;
                if (parser.search || parser.hash) {
                    var queryParams = parser.search.substring(1).replace(/\/$/, '');
                    var qs = parseQueryString(queryParams);
                    var hashParams = parser.hash.substring(1).replace(/\/$/, '');
                    var hash = parseQueryString(hashParams);
                    angular.extend(qs, hash);
                    if (qs.error) {
                        deferred.reject({ error: qs.error });
                    } else {
                        deferred.resolve(qs);
                    }
                    popupWindow.close();
                }
            });

            popupWindow.addEventListener('exit', function() {
                deferred.reject({ data: 'Provider Popup was closed' });
            });

            popupWindow.addEventListener('loaderror', function() {
                deferred.reject({ data: 'Authorization Failed' });
            });

            return deferred.promise;
        };

        popup.pollPopup = function() {
            var deferred = $q.defer();
            polling = $interval(function() {
                try {
                    var documentOrigin = document.location.host + ':' + document.location.port,
                        popupWindowOrigin = popupWindow.location.host + ':' + popupWindow.location.port;
                    if (popupWindowOrigin === documentOrigin && (popupWindow.location.search || popupWindow.location.hash)) {
                        var queryParams = popupWindow.location.search.substring(1).replace(/\/$/, '');
                        var hashParams = popupWindow.location.hash.substring(1).replace(/\/$/, '');
                        var hash = parseQueryString(hashParams);
                        var qs = parseQueryString(queryParams);
                        angular.extend(qs, hash);
                        if (qs.error) {
                          deferred.reject({ error: qs.error });
                        } else {
                          deferred.resolve(qs);
                        }
                        popupWindow.close();
                        $interval.cancel(polling);
                    }
                } catch (error) {
                    console.log(error);
                }

                if (!popupWindow) {
                    $interval.cancel(polling);
                    deferred.reject({ data: 'Provider Popup Blocked' });
                } else if (popupWindow.closed || popupWindow.closed === undefined) {
                    $interval.cancel(polling);
                    deferred.reject({ data: 'Authorization Failed' });
                }
            }, 35);
            return deferred.promise;
        };

        popup.prepareOptions = function(options) {
            var width = options.width || 500;
            var height = options.height || 500;
            return angular.extend({
                width: width,
                height: height,
                left: $window.screenX + (($window.outerWidth - width) / 2),
                top: $window.screenY + (($window.outerHeight - height) / 2.5)
            }, options);
        };

        popup.stringifyOptions = function(options) {
            var parts = [];
            angular.forEach(options, function(value, key) {
                parts.push(key + '=' + value);
            });
            return parts.join(',');
        };

        return popup;
    };
    
    
    /***** UTILS ****/
     var camelCase = function(name) {
        return name.replace(/([\:\-\_]+(.))/g, function(_, separator, letter, offset) {
          return offset ? letter.toUpperCase() : letter;
        });
      };

      var parseQueryString = function(keyValue) {
        var obj = {}, key, value;
        angular.forEach((keyValue || '').split('&'), function(keyValue) {
          if (keyValue) {
            value = keyValue.split('=');
            key = decodeURIComponent(value[0]);
            obj[key] = angular.isDefined(value[1]) ? decodeURIComponent(value[1]) : true;
          }
        });
        return obj;
      };

      var joinUrl = function() {
        var joined = Array.prototype.slice.call(arguments, 0).join('/');

        var normalize = function(str) {
          return str
            .replace(/[\/]+/g, '/')
            .replace(/\/\?/g, '?')
            .replace(/\/\#/g, '#')
            .replace(/\:\//g, '://');
        };

        return normalize(joined);
      };
})
;