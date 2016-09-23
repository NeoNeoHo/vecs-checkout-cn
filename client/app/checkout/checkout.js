'use strict';

angular.module('webApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('checkout', {
        url: '/checkout',
        templateUrl: 'app/checkout/checkout.html',
        controller: 'CheckoutController',
        // controllerAs: 'checkout',
        authenticate: true
      });
  });
