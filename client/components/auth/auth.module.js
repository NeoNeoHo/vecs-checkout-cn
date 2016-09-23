'use strict';

angular.module('webApp.auth', [
  'webApp.constants',
  'webApp.util',
  'ngCookies',
  'ui.router'
])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
