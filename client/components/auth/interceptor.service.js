'use strict';

(function() {

function authInterceptor($rootScope, $q, $cookies, $injector, Util, $location) {
  var state;
  return {
    // Add authorization token to headers
    request(config) {
      var searchUrlObject = $location.search();
      config.headers = config.headers || {};
      // if ($cookies.get('vecs_token') && Util.isSameOrigin(config.url)) {
      if ($cookies.get('vecs_token')) {
        config.headers.Authorization = 'Bearer ' + $cookies.get('vecs_token');
      } else if (searchUrlObject['vecs_t']) {
        $cookies.put('vecs_token', searchUrlObject['vecs_t']);
        config.headers.Authorization = 'Bearer ' + searchUrlObject['vecs_t'];
      }
      return config;
    },

    // Intercept 401s and redirect you to login
    responseError(response) {
      if (response.status === 401) {
        // (state || (state = $injector.get('$state'))).go('login');
        window.location = "http://vecs-gardenia.com.cn/index.php?route=account/login";
        // remove any stale tokens
        $cookies.remove('vecs_token');
      }
      return $q.reject(response);
    }
  };
}

angular.module('webApp.auth')
  .factory('authInterceptor', authInterceptor);

})();
