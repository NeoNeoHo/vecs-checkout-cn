'use strict';

angular.module('webApp')
	.controller('SuccessCtrl', function ($scope, $location, Order, $cookies, Config, Cart, Customer) {
		Cart.clear();
		$scope.message = 'Hello';
		$scope.order_totals = '';
		var urlParams = $location.search();
		var order_id = urlParams['order_id'] ? urlParams['order_id'] : 0;
		Order.getOrderProducts(order_id).then(function(order) {
			$scope.order = order;
			// console.log(order);
			$scope.order_status_level = Order.getStatusLevel($scope.order.order_status_id);
			fbq('track', 'Purchase', {value:order.total.toFixed(2), currency:'TWD'});
			ga('require', 'ecommerce');
			ga('ecommerce:addTransaction', {
				'id': order.order_id,                     // Transaction ID. Required.
				'affiliation': 'Vecs Gardenia',   										// Affiliation or store name.
				'revenue': order.total.toString(),               		// Grand Total.
				'shipping': '',                  										// Shipping.
				'tax': '',
				'currency': 'TWD'                   												
			});
			for(var i=0; i < _.size(order.products); i++) {
				ga('ecommerce:addItem', {
					'id': order.order_id,                     // Transaction ID. Required.
					'name': order.products[i].name,    														// Product name. Required.
					'sku': '123',                 									// SKU/code.
					'category': 'Cosmetic',         									// Category or variation.
					'price': order.products[i].total.toString(),                 	// Unit price.
					'quantity': order.products[i].quantity.toString(),             // Quantity.
					'currency': 'TWD'
				});
			}
			ga('ecommerce:send');
			// console.log(order);

			Order.getOrderTotals(order_id).then(function(order_totals) {
				$scope.order_totals = order_totals;
			}, function(err) {

			});
		}, function(err) {
			console.log(err);
		});
		Customer.updateCustomer({cart: ''}).then(function(result) {
			console.log(result);
		}, function(err) {
			console.log(err);
		});
		// $cookies.remove('vecs_cart', {domain: Config.DIR_COOKIES});
		$scope.backToHome = function() {
			window.location.href = Config.DIR_DOMAIN;
		}
	});
