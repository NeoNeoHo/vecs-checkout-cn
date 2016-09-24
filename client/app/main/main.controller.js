'use strict';

angular.module('webApp')
	.controller('MainController', function ($scope, $state, $http, $sce) {
		$http.get('/api/alipays/36758').then(function(data) {
			$scope.result_html = $sce.trustAsHtml(data.data);
		}, function(err) {

		});
	});
