'use strict';

(function() {

angular.module('webApp.auth')
  .run(function($rootScope, $state, Auth, Config) {
    // Redirect to login if route requires auth and the user is not logged in, or doesn't have required role
    $rootScope.$on('$stateChangeStart', function(event, next) {
      if (!next.authenticate) {
        return;
      }

      if (typeof next.authenticate === 'string') {
        Auth.hasRole(next.authenticate, _.noop).then(has => {
          if (has) {
            return;
          }

          event.preventDefault();
          return Auth.isLoggedIn(_.noop).then(is => {
            // console.log('fdasjfo');
            $state.go(is ? 'main' : 'login');
          });
        });
      } else {
        Auth.isLoggedIn(_.noop).then(is => {
          if (is) {
            return;
          }
          // console.log('xxxxxx');
          event.preventDefault();
          window.location = Config.DIR_DOMAIN;
          // $state.go('login');
        });
      }
    });
  });

})();
