'use strict';

angular.module('webApp')
  .config(function($stateProvider) {
	$stateProvider
	  .state('checkout.product_check', {
		url: '/product_check',
		templateUrl: 'app/checkout/product_check/product_check.html',
		// controller: 'CheckoutController',
		authenticate: true,
		resolve: {
			// Constant title
			$title: function() { return '商品結帳'; }
		}
	  });
  });