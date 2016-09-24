'use strict';

angular.module('webApp')
	.controller('MainController', function ($scope, $state, $http) {
		// $state.go('checkout.product_check');
		$http.get('/api/alipays/36758').then(function(data) {
			$scope.result = data;
		}, function(err) {

		});
	});
