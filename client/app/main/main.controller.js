'use strict';

angular.module('webApp')
	.controller('MainController', function ($scope, $state) {
		$state.go('checkout.product_check');
	});
