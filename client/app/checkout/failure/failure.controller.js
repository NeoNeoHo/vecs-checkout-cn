'use strict';

angular.module('webApp')
	.controller('FailureCtrl', function ($scope, $location, Order, Config, Cart, Customer, $state) {
		var urlParams = $location.search();
		var order_id = urlParams['order_id'];
		var msg = urlParams['msg'];
		if(order_id) {
			Order.getOrderProducts(order_id).then(function(order) {
				$scope.order = order;
				$scope.order_status_level = Order.getStatusLevel($scope.order.order_status_id);
				Customer.updateCustomer({cart: ''}).then(function(result) {
					console.log(result);
				}, function(err) {
					console.log(err);
				});
			}, function(err) {
				window.location.href = Config.DIR_DOMAIN;
			});
		}


		$scope.backToHome = function() {
			window.location.href = Config.DIR_DOMAIN;
		}
		$scope.backToCheckout = function() {
			$state.go('checkout.shipment_payment');
		}
	});
