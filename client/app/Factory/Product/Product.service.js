'use strict';

angular.module('webApp')
	.factory('Product', function ($q, $http, Config) {
		var DIR_IMAGE_PATH = Config.DIR_IMAGE_PATH;

		var validateProducts = function(product_coll) {
			var defer = $q.defer();
			$http.post('/api/products/validate/', {
				product_coll: product_coll
			})
			.then(function(result) {
				defer.resolve(result);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var getDiscounts = function(product_id_list) {
			var defer = $q.defer();
			$http.get('/api/products/discount/'+JSON.stringify(product_id_list))
			.then(function(result) {
				var product_discount_conditions = result.data;
				defer.resolve(product_discount_conditions);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;			
		};

		var getPrices = function(product_id_list) {
			var defer = $q.defer();
			$http.get('/api/products/price/'+JSON.stringify(product_id_list))
			.then(function(result) {
				var product_prices = result.data;
				defer.resolve(product_prices);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;			
		};

		var getProducts = function(product_id_list) {
			var defer = $q.defer();
			$http.get('/api/products/'+JSON.stringify(product_id_list))
			.then(function(result) {
				defer.resolve(result.data);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;	
		};

		var getProductsDetail = function(products) {
			var defer = $q.defer();
			var product_id_list = _.pluck(products, 'product_id');
			var promises = [];
			promises.push(getProducts(product_id_list));
			promises.push(getPrices(product_id_list));
			promises.push(getDiscounts(product_id_list));
			$q.all(promises).then(function(datas) {
				var db_products = datas[0];
				var db_prices = datas[1];
				var db_discounts = datas[2];
				db_products = _.map(db_products, function(db_product) {
					db_product.image = DIR_IMAGE_PATH+'/'+db_product.image.replace('PRODUCT', 'PRODUCT_THUMB');
					db_product.price =  _.pick(_.find(db_prices, {product_id: db_product.product_id}), ['unit_price', 'special_price']);
					db_product.discount = _.sortBy(_.filter(db_discounts, {product_id: db_product.product_id}), 'quantity');
					if(!db_product.discount) db_product.discount = [];
					return db_product;
				});
				defer.resolve(db_products);
			}, function(err) {
				defer.reject(datas);
			});
			return defer.promise;
		}
		// Public API here
		return {
			someMethod: function () {
				return meaningOfLife;
			},
			validateProducts: validateProducts,
			getDiscounts: getDiscounts,
			getPrices: getPrices,
			getProducts: getProducts,
			getProductsDetail: getProductsDetail
		};
	});
