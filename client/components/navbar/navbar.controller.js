angular.module('webApp')
	.controller('NavbarController', function($scope, $sce, Auth, Megamenu) {
		$scope.menu = [
			{
				title: 'Home',
				state: 'main'
			},
			{
				title: 'Checkout',
				state: 'checkout'
			}
		];
		$scope.isCollapsed = true;
		$scope.isLoggedIn = Auth.isLoggedIn;
		$scope.isAdmin = Auth.isAdmin;
		$scope.getCurrentUser = Auth.getCurrentUser;
		$scope.trustAsHtml = function(string) {
    		return $sce.trustAsHtml(string);
		};
		Megamenu.getTree().then(function(data) {
			$scope.megamenu = data;
		}, function(err) {});
	});

