'use strict';

angular.module('webApp')
	.factory('Cart', function ($q, $http, Config, $cookies, Product) {
		var cart_cache = '';

		var checkDiscount = function(cart) {
			cart.products = _.map(cart.products, function(product) {
				var discounts = product.discount;
				if(_.size(discounts) > 0) {
					var discount_available = _.sortBy(_.filter(discounts, function(discount) {
						return discount.quantity <= product.quantity;
					}), 'quantity');
					product.spot_price = (discount_available.length) ? discount_available[discount_available.length - 1].price : product.price.special_price;
				}
				return product;
			});
			return cart;		
		};

		var updateProductTotal = function(cart) {
			cart.products = _.map(cart.products, function(product) {
				product.total = (product.spot_price + product.option_price) * product.quantity;
				return product;
			});
			return cart;
		};

		var clearCartCookieSession = function() {
			var defer = $q.defer();
			$cookies.remove('vecs_cart', {domain: Config.DIR_COOKIES});
			// $cookies.remove('vecs_token', {domain: Config.DIR_COOKIES});
			$cookies.remove('vecs_reward', {domain: Config.DIR_COOKIES});
			$cookies.remove('vecs_coupon', {domain: Config.DIR_COOKIES});
			$cookies.remove('vecs_voucher', {domain: Config.DIR_COOKIES});
			$http.delete('/api/carts/session/').then(function(result) {
				defer.resolve(result);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var updateSession = function(cart_products) {
			var defer = $q.defer();
			var update_products = _.map(cart_products, function(product) {
				if(product.key) {
					return {product_key: product.key, quantity: product.quantity};
				} else {
					defer.reject('no product key');
				}
			});
			
			$http.put('/api/carts/session/', {update_products: update_products})
			.then(function(result) {
				defer.resolve(result);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var updateCartCookiesSession = function(products) {
			var defer = $q.defer();
			products = _.map(products, function(product) {
				return _.pick(product, ['key', 'option', 'product_id', 'quantity', 'href', 'thumb']);
			});
			$cookies.put('vecs_cart', JSON.stringify(products), {domain: Config.DIR_COOKIES});
			updateSession(products).then(function(data) {
				defer.resolve(data);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var updateCartTotal = function(cart) {
			cart = checkDiscount(cart);
			cart = updateProductTotal(cart);
			cart.product_total_price = _.reduce(cart.products, function(sum, o){return sum+o.total}, 0);
			console.log('fjdosifjasoif');
			console.log(cart);
			updateCartCookiesSession(cart.products);
			return cart;
		};
		var getSession = function() {
			var defer = $q.defer();
			$http.get('/api/carts/session/')
			.then(function(result) {
				console.log(result);
				defer.resolve(result);
			}, function(err) {
				console.log(err);
				defer.reject(err);
			});
			return defer.promise;
		};
		var getCart = function() {
			var defer = $q.defer();
			// if(!$cookies.get('vecs_cart')) {
			// 	console.log('redirect to host');
			// 	window.location.href = Config.DIR_DOMAIN;
			// }
			// var cart_cookies = JSON.parse($cookies.get('vecs_cart'));
			getSession().then(function(result) {
				var cart_cookies = result.data.cart;

				var clean_cart_cookies = _.map(cart_cookies, function(lproduct) {
					lproduct.product_id = parseInt(lproduct.product_id);
					return lproduct;
				});
				console.log(cart_cookies);
				var cart = {
					products: clean_cart_cookies,
					product_total_price: _.reduce(cart_cookies, function(sum, o){return sum+o.price*o.quantity}, 0),
					discount: {
						reward: {
							saved_amount: 0,
							name: ''
						},
						coupon: {
							saved_amount: 0,
							name: '',
							id: 0
						},
						voucher: {
							saved_amount: 0,
							name: '',
							id: 0,
							available_amount: 0
						}
					},
					shipment_fee: 0,
				};
				console.log('Cart 到底是什麼');
				console.log(cart);
				Product.getProductsDetail(cart.products).then(function(db_products) {
					cart.products = _.map(cart.products, function(product) {
						var db_product = _.find(db_products, {product_id: product.product_id});
						if(db_product) {
							product.price = db_product.price;
							product.discount = db_product.discount || [];
							product.reward = db_product.reward;
							product.model = db_product.model;
							product.name = db_product.name;
							product.image = db_product.image;
							product.spot_price = product.price.special_price;
							product.option_price = _.reduce(_.pluck(product.option, 'price'), function(sum, num){return sum+num;}, 0);
							
							product.total = (product.spot_price + product.option_price) * product.quantity;
						} else {
							product = {};
						}
						return product;
					});
					cart = updateCartTotal(cart);
					// cart_cache = cart;
					defer.resolve(cart);
				}, function(err) {
					defer.reject(err);
				});
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};



		var clear = function() {
			console.log('Clear Cart');
			clearCartCookieSession();
			// window.location.href = Config.SERVER_HOST + '/index.php?route=checkout/cart/clear';
		};

		// Public API here
		return {
			getCart: getCart,
			updateCartTotal: updateCartTotal,
			updateSession: updateSession,
			clear: clear,
			getSession: getSession
		};
	});
