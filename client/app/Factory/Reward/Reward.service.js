'use strict';

angular.module('webApp')
	.factory('Reward', function ($q, $http) {
		// Service logic
		// ...

		var meaningOfLife = 42;
		var getFromCustomer = function() {
			var defer = $q.defer();
			$http.get('/api/rewards/')
			.then(function(result) {
				if(result.data.points && result.data.points < 0) {
					result.data.points = 0;
				}
				defer.resolve(result.data);
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
			getFromCustomer: getFromCustomer
		};
	});
