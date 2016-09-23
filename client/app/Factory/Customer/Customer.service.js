'use strict';

angular.module('webApp')
	.factory('Customer', function ($q, $http) {
		// Service logic
		// ...

		var meaningOfLife = 42;
		var updateCustomer = function(info) {
			var defer = $q.defer();
			$http.put('/api/customers/', info)
			.then(function(result) {
				defer.resolve(result);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};
		// Public API here
		return {
			someMethod: function () {
				return meaningOfLife;
			},
			updateCustomer: updateCustomer
		};
	});
