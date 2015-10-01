angular.module('SciamlabWebTemplate')
    .factory('satoauth', [
      '$q',
      '$http',
      'satconfig',
      'satshared',
      'satOauth1',
      'satOauth2',
      function($q, $http, config, shared, Oauth1, Oauth2) {
        var oauth = {};

        oauth.authenticate = function(name, redirect, userData) {
          var provider = config.providers[name].type === '1.0' ? new Oauth1() : new Oauth2();
          var deferred = $q.defer();

          provider.open(config.providers[name], userData || {})
            .then(function(response) {
              shared.setToken(response, redirect);
              deferred.resolve(response);
            })
            .catch(function(error) {
              deferred.reject(error);
            });

          return deferred.promise;
        };

        oauth.unlink = function(provider) {
          if (config.unlinkMethod === 'get') {
            return $http.get(config.unlinkUrl + provider);
          } else if (config.unlinkMethod === 'post') {
            return $http.post(config.unlinkUrl, provider);
          }
        };

        return oauth;
      }])
    .factory('satOauth2', [
      '$q',
      '$http',
      '$window',
      'satpopup',
      'satutils',
      'satconfig',
      'satstorage',
      function($q, $http, $window, popup, utils, config, storage) {
        return function() {

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

            var stateName = defaults.name + '_state';

            if (angular.isFunction(defaults.state)) {
              storage.set(stateName, defaults.state());
            } else if (angular.isString(defaults.state)) {
              storage.set(stateName, defaults.state);
            }

            var url = defaults.authorizationEndpoint + '?' + oauth2.buildQueryString();

            return popup.open(url, defaults.popupOptions, defaults.redirectUri)
              .then(function(oauthData) {
                if (defaults.responseType === 'token') {
                  return oauthData;
                }
                if (oauthData.state && oauthData.state !== storage.get(stateName)) {
                  return $q.reject('OAuth 2.0 state parameter mismatch.');
                }
                return oauth2.exchangeForToken(oauthData, userData);
              });

          };

          oauth2.exchangeForToken = function(oauthData, userData) {
            var data = angular.extend({}, userData, {
              code: oauthData.code,
              clientId: defaults.clientId,
              redirectUri: defaults.redirectUri
            });

            if (oauthData.state) {
              data.state = oauthData.state;
            }

            angular.forEach(defaults.responseParams, function(param) {
              data[param] = oauthData[param];
            });

            return $http.post(utils.joinUrl(config.baseUrl, defaults.url), data, { withCredentials: config.withCredentials });
          };

          oauth2.buildQueryString = function() {
            var keyValuePairs = [];
            var urlParams = ['defaultUrlParams', 'requiredUrlParams', 'optionalUrlParams'];

            angular.forEach(urlParams, function(params) {
              angular.forEach(defaults[params], function(paramName) {
                var camelizedName = utils.camelCase(paramName);
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
      }])
    .factory('satOauth1', [
      '$q',
      '$http',
      'satpopup',
      'satconfig',
      'satutils',
      function($q, $http, popup, config, utils) {
        return function() {

          var defaults = {
            url: null,
            name: null,
            popupOptions: null,
            redirectUri: null
          };

          var oauth1 = {};

          oauth1.open = function(options, userData) {
            angular.extend(defaults, options);

            return popup.open(utils.joinUrl(config.baseUrl, defaults.url), defaults.popupOptions, defaults.redirectUri)
              .then(function(response) {
                return oauth1.exchangeForToken(response, userData);
              });
          };

          oauth1.exchangeForToken = function(oauthData, userData) {
            var data = angular.extend({}, userData, oauthData);
            var qs = oauth1.buildQueryString(data);

            return $http.get(utils.joinUrl(config.baseUrl, defaults.url) + '?' + qs);
          };

          oauth1.buildQueryString = function(obj) {
            var str = [];

            angular.forEach(obj, function(value, key) {
              str.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            });

            return str.join('&');
          };

          return oauth1;
        };
      }])
    .factory('satpopup', [
      '$q',
      '$interval',
      '$window',
      '$location',
      'satconfig',
      'satutils',
      function($q, $interval, $window, $location, config, utils) {
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

          if (config.platform === 'mobile') {
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
              var hashParams = parser.hash.substring(1).replace(/\/$/, '');
              var hash = utils.parseQueryString(hashParams);
              var qs = utils.parseQueryString(queryParams);

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
                var hash = utils.parseQueryString(hashParams);
                var qs = utils.parseQueryString(queryParams);

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
      }]);