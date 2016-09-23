'use strict';

angular.module('webApp')
	.factory('Megamenu', function ($q, $http) {
		var getTree = function() {
			var defer = $q.defer();
			// $http.get('/api/megamenus/')
			$http.get('http://vecs-gardenia.com.cn/index.php?route=api/megamenu/getTree').then(function(result) {
				defer.resolve(result.data.treemenu);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};
		// Public API here
		return {
			getTree: getTree,
		};
	});
