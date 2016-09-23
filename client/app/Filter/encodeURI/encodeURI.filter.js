'use strict';

angular.module('webApp')
  .filter('encodeURI', function () {
    return function (input) {
      return window.encodeURIComponent(input);
    };
  });
