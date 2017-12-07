'use strict';

angular.module('webApp')
	.controller('CheckoutController', function ($rootScope, $scope, $window, $state, $document, $location, $cookies, $sce, $http, $q, User, Auth,  Location, Shipment, Payment, Promotion, Cart, Customer, Reward, Product, Config) {
		$rootScope.$state = $state;
		$rootScope.$on('$stateChangeSuccess', function() {
   			var someElement = angular.element(document.getElementById('form-container'));
    		$document.scrollToElementAnimated(someElement, 0, 800);
		});
		$scope.currentUser = $scope.currentUser || Auth.getCurrentUser();
		$scope.allow_amount = $scope.allow_amount || _.range(1,20);
		var SHIPMENT_HOME_FEE = Config.SHIPPING_FEE.HOME;
		var FREESHIPPING_FEE = Config.FREE_SHIPPING_CONDICTION.EZSHIP;

		var SHIPPING_NAME = Config.SHIPPING_NAME;
		var PAYMENT_NAME = Config.PAYMENT_NAME;
		$scope.SHIPPING_NAME = SHIPPING_NAME;
		$scope.PAYMENT_NAME = PAYMENT_NAME;
		$scope.is_address_valid = $scope.is_address_valid || true;
		$scope.errors = {};

		$scope.cross_obj = {
			temp_reward_use: '', 
			DIR_DOMAIN: Config.DIR_DOMAIN,
			is_submitted: false
		};

		$scope.shipping_info = $scope.shipping_info || {
			firstname: '',
			telephone: '',
			country_id: 44,
			payment_sel_str: null,
			shipment_sel_str: null
		};

		Cart.getCart().then(function(cart) {
			$scope.cart = cart;
			$scope.cart.total_price_with_discount = cart.product_total_price - cart.discount.coupon.saved_amount - cart.discount.voucher.saved_amount;
			$scope.currentUser.$promise.then(function(data) {
				$scope.shipping_info.firstname = $scope.shipping_info.firstname || data.firstname;
				$scope.shipping_info.telephone = $scope.shipping_info.telephone || data.telephone;
				$scope.shipping_info.email = $scope.shipping_info.email || data.email;
				$scope.shipping_info.shipment_sel_str = SHIPPING_NAME.ship_to_home;
				$scope.shipping_info.payment_sel_str = PAYMENT_NAME.alipay;
			});
			if(!$scope.shipping_info.address) {
				getAddress();
			}

			Reward.getFromCustomer().then(function(reward) {
				$scope.cart.rewards_customer_has_pts = (reward.points) ? reward.points : 0;
				$scope.cart.rewards_available = ($scope.cart.total_price_with_discount > $scope.cart.rewards_customer_has_pts) ? $scope.cart.rewards_customer_has_pts : $scope.cart.total_price_with_discount;

				// 滿額禮區域
				Cart.addGiftWithPurchase($scope.cart).then(function(lcart) {
					$scope.cart = lcart;
				}, function(err) {
				});

			}, function(err) {
				$scope.cart.rewards_customer_has_pts = 0;
				$scope.cart.rewards_available = 0;
				// $state.go('failure');
			});

			if($cookies.get('vecs_coupon')) {
				$scope.cart.discount.coupon.name = $cookies.get('vecs_coupon');
				$scope.calcCouponSaved();
			}

			if($cookies.get('vecs_reward')) {
				$scope.cross_obj.temp_reward_use = parseInt($cookies.get('vecs_reward'));
				$scope.calcRewardSaved();				
			}
		}, function(err) {
			console.log(err);
			window.location.href = Config.DIR_DOMAIN;
			// $state.go('failure');
		});

		$scope.checkout_first_step = function() {
			$state.go('checkout.product_check');
		};
		$scope.checkout_second_step = function() {
			if($scope.checkout_form.$valid){
				// 滿額禮區域
				Cart.addGiftWithPurchase($scope.cart).then(function(lcart) {
					$scope.cart = lcart;
				}, function(err) {
				});
				$scope.setPaymentMethod(SHIPPING_NAME.ship_to_home);
				$state.go('checkout.shipment_payment');
			} else {
				console.log($scope.checkout_form.$valid);
			}
		};
		$scope.checkout_third_step = function() {
			$scope.is_address_valid = $scope.shipping_info.city_d && $scope.shipping_info.district_d && $scope.shipping_info.sub_district_d && $scope.shipping_info.address && ($scope.shipping_info.district_id !== 0);
			$scope.setShipmentFee();
			console.log($scope.shipping_info);
			if($scope.checkout_form.$valid && $scope.is_address_valid){
				// 滿額禮區域
				Cart.addGiftWithPurchase($scope.cart).then(function(lcart) {
					$scope.cart = lcart;
				}, function(err) {
				});
				$state.go('checkout.final_confirm');
			} else {
				$scope.is_address_valid = false;
			}
		};

		$scope.payment_btn = {
			alipay: true
		};
		$scope.with_city_ready = false;
		$scope.with_district_ready = false;


		var lstrcmp = function(collection, str) {
			var result = _.some(collection, function(data){
				return data.localeCompare(str) == 0;
			});
			return result;
		}
		var getDiscountPrice = function() {
			var discount_price = $scope.cart.product_total_price - $scope.cart.discount.coupon.saved_amount - $scope.cart.discount.voucher.saved_amount - $scope.cart.discount.reward.saved_amount;
			return discount_price;
		};
		var getAvailableReward = function() {
			var total_price_with_discount_wo_reward = $scope.cart.product_total_price - $scope.cart.discount.coupon.saved_amount - $scope.cart.discount.voucher.saved_amount;
			return (total_price_with_discount_wo_reward > $scope.cart.rewards_customer_has_pts) ? $scope.cart.rewards_customer_has_pts : total_price_with_discount_wo_reward;
		};
		$scope.updateCartTotal = function() {
			$scope.cart = Cart.updateCartTotal($scope.cart);
			$scope.cart.total_price_with_discount = getDiscountPrice();
			$scope.cart.rewards_available = getAvailableReward();
			if($scope.cart.discount.coupon.saved_amount > 0) {
				$scope.calcCouponSaved();
			}
			// 滿額禮區域
			Cart.addGiftWithPurchase($scope.cart).then(function(lcart) {
				$scope.cart = lcart;
			}, function(err) {
			});
		};

		$scope.removeProduct = function(key='') {
			$scope.cart.products = _.reject($scope.cart.products, {key: key});
			$scope.updateCartTotal();
			if($scope.cart.discount.coupon.saved_amount > 0) {
				$scope.calcCouponSaved();
			}
			// 滿額禮區域
			Cart.addGiftWithPurchase($scope.cart).then(function(lcart) {
				$scope.cart = lcart;
			}, function(err) {
			});
			return true;
		};

		$scope.setCities = function(country_id) {
			var defer = $q.defer();
			if(country_id == ""){
				defer.reject(new Error('no country_id'));
			}
			$scope.with_city_ready = false;
			if($scope.country_coll) {
				$scope.shipping_info.country_d = _.find($scope.country_coll, {country_id: $scope.shipping_info.country_id});
			}
			Location.getCities(country_id).then(function(result) {
				$scope.city_coll = result.cities;
				$scope.with_city_ready = true;
				defer.resolve(result.cities);
			}, function(err) {
				console.log(err);
				defer.reject(err);
			});
			return defer.promise;
		};

		$scope.setDistricts = function(city_id) {
			var defer = $q.defer();
			console.log(city_id);
			if(city_id){			
				$scope.with_district_ready = false;
				$scope.with_sub_district_ready = false;
				if($scope.city_coll){
					$scope.shipping_info.city_d = _.find($scope.city_coll, {zone_id: city_id});
				}
				Location.getDistricts(city_id).then(function(result) {
					$scope.district_coll = result.districts;
					$scope.with_district_ready = true;
					defer.resolve(result.districts);
				}, function(err) {
					console.log(err);
					defer.reject(err);
				});
			} else {
				defer.reject(new Error('no city_id'));
			}
			return defer.promise;
		};

		$scope.setSubDistricts = function(district_id) {
			var defer = $q.defer();
			console.log(district_id);
			if(district_id){
				$scope.with_sub_district_ready = false;
				if($scope.district_coll){
					$scope.shipping_info.district_d = _.find($scope.district_coll, {district_id: district_id});
				}
				Location.getSubDistricts(district_id).then(function(result) {
					$scope.sub_district_coll = result.sub_districts;
					$scope.with_sub_district_ready = true;
					defer.resolve(result.sub_districts);
				}, function(err) {
					console.log(err);
					defer.reject(err);
				});		
			} else {
				defer.reject(new Error('no district_id'));
			}
			return defer.promise;
		};

		$scope.setDistrictName = function(district_id) {
			if($scope.district_coll) {
				$scope.shipping_info.district_d = _.find($scope.district_coll, {district_id: district_id});
			}
		};

		$scope.setSubDistrictName = function(sub_district_id) {
			if($scope.sub_district_coll) {
				$scope.shipping_info.sub_district_d = _.find($scope.sub_district_coll, {sub_district_id: sub_district_id});
			}
		};

		$scope.setCityName = function(city_id) {
			if($scope.city_coll){
				$scope.shipping_info.city_d = _.find($scope.city_coll, {zone_id: city_id});
			}
		};

		var getAddress = function() {
			Location.getAddress().then(function(data) {
				if(data) {
					$scope.shipping_info.country_id = (data.country_id) ? data.country_id : 0;
					$scope.shipping_info.country_d = {country_id: data.country_id, name: data.country_name};
					$scope.setCities((data.country_id) ? data.country_id : 44)

					$scope.shipping_info.city_id = (data.zone_id) ? data.zone_id : 0;
					$scope.shipping_info.city_d = {zone_id: data.zone_id, name: data.city_name};
					$scope.setDistricts((data.zone_id) ? data.zone_id : '').then(function() {
						$scope.shipping_info.district_id = (data.district_id) ? data.district_id : 0;
						$scope.setDistrictName($scope.shipping_info.district_id);

						$scope.setSubDistricts((data.district_id) ? data.district_id : '').then(function() {
							$scope.shipping_info.sub_district_id = (data.sub_district_id) ? data.sub_district_id : 0;
							$scope.setSubDistrictName($scope.shipping_info.sub_district_id);

							$scope.shipping_info.address = data.address_1 ? data.address_1 : '';							
						}).catch(function(err) {
							$scope.errors.address_msg = err;
						});						
					}).catch(function(err) {
							$scope.errors.address_msg = err;
					});




				}
				console.log($scope.shipping_info);
			}, function(err) {
				console.log(err);
				// $state.go('failure');
			});
		};

		$scope.setPaymentMethod = function(lmethod) {
			$scope.shipping_info.shipment_sel_str = lmethod;
			$scope.shipping_info.country_id = 44;
			$scope.payment_btn.alipay = true;

			var total_price_with_discount = $scope.cart.product_total_price - $scope.cart.discount.reward.saved_amount - $scope.cart.discount.coupon.saved_amount;
			$scope.shipping_info.country_id = 44;
			$scope.setCities(44);
			$scope.cart.shipment_fee = (total_price_with_discount >= FREESHIPPING_FEE) ? 0 : SHIPMENT_HOME_FEE;
			$scope.shipping_info.shipment_fee = $scope.cart.shipment_fee;
		};

		$scope.setShipmentFee = function() {
			var total_price_with_discount = $scope.cart.product_total_price - $scope.cart.discount.reward.saved_amount - $scope.cart.discount.coupon.saved_amount;
			$scope.cart.shipment_fee = (total_price_with_discount >= FREESHIPPING_FEE) ? 0 : SHIPMENT_HOME_FEE;
			$scope.shipping_info.shipment_fee = $scope.cart.shipment_fee;
		};

		$scope.calcRewardSaved = function() {
			console.log('calcRewardSaved');
			var defer = $q.defer();
			if(!isNaN($scope.cross_obj.temp_reward_use)) {
				Promotion.calcRewardSaved($scope.cross_obj.temp_reward_use, $scope.cart).then(function(resp_reward) {
					$scope.cart.discount.reward = resp_reward;
					$scope.cart.total_price_with_discount = getDiscountPrice();
					$scope.cart.rewards_available = getAvailableReward();
					var date = new Date();
					var expired_min = 5;
					date.setTime(date.getTime() + (expired_min * 60 * 1000));
					$cookies.put('vecs_reward', $scope.cart.discount.reward.saved_amount, {domain: Config.DIR_COOKIES, expires: date});
					defer.resolve();
				}, function(err) {
					alert(err);
					$scope.cart.discount.reward.saved_amount = 0;
					$scope.cross_obj.temp_reward_use = '';
					$scope.cart.total_price_with_discount = getDiscountPrice();
					$scope.cart.rewards_available = getAvailableReward();
					$cookies.remove('vecs_reward');
					defer.reject(err);
				});
			} else {
				defer.resolve();
			}		
			return defer.promise;
		};

		$scope.calcCouponSaved = function() {
			console.log('calcCouponSaved');
			var defer = $q.defer();
			Promotion.calcCouponSaved($scope.cart.discount.coupon.name, $scope.cart).then(function(resp_coupon) {
				$scope.cart.discount.coupon = resp_coupon;
				$scope.cart.total_price_with_discount = getDiscountPrice();
				$scope.cart.rewards_available = getAvailableReward();
				var date = new Date();
				var expired_min = 5;
				date.setTime(date.getTime() + (expired_min * 60 * 1000));
				$cookies.put('vecs_coupon', $scope.cart.discount.coupon.name, {domain: Config.DIR_COOKIES, expires: date});
				defer.resolve();			
			}, function(err) {
				alert(err);
				$scope.cart.discount.coupon.saved_amount = 0;
				$scope.cart.discount.coupon.name = '';
				$scope.cart.total_price_with_discount = getDiscountPrice();
				$scope.cart.rewards_available = getAvailableReward();
				$cookies.remove('vecs_coupon');
				defer.reject(err);
			});
			return defer.promise;
		};

		$scope.proceedCheckout = function() {
			$scope.cross_obj.is_submitted = true;
			if($scope.checkout_form.$invalid) {
				alert('请检查结帐资讯，谢谢');
				$scope.cross_obj.is_submitted = false;
				$scope.checkout_second_step();
				return 0;
			}
			if(!$scope.shipping_info.shipment_sel_str || !$scope.shipping_info.payment_sel_str) {
				alert('请检查配送资讯，谢谢');
				$scope.cross_obj.is_submitted = false;
				$scope.checkout_second_step();
				return 0;
			}
			$scope.setShipmentFee();
			var shipping_promise = [];
			var payment_promise = [];
			var shipment_method = $scope.shipping_info.shipment_sel_str;
			var payment_method = $scope.shipping_info.payment_sel_str;
			var customer_to_update = {
				firstname: $scope.shipping_info.firstname,
				lastname: ' ',
				telephone: $scope.shipping_info.telephone
			};

			// Step 1. 更新用戶資料
			Customer.updateCustomer(customer_to_update).then(function(result) {}, function(err){console.log(err);});
			
			// Step 2. 檢查商品資訊是否有被篡改 
			Product.validateProducts($scope.cart.products).then(function(data) {

			}, function(err) {
				$scope.cross_obj.is_submitted = false;
				alert(err.data + '  ，請關閉此訊息欄，並重新點選購物車，謝謝');
				window.location.href = Config.DIR_DOMAIN;
				return 0;
			});

			// Step 4. 處理特殊需求 Comment
			if($scope.shipping_info.dmRequest) {
				if($scope.shipping_info.comment) {
					$scope.shipping_info.comment = $scope.shipping_info.comment + '; ' + '我需要产品画册目录';
				} else {
					$scope.shipping_info.comment = '我需要产品画册目录';
				}	
			}
			// Step 3. 檢查優惠內容與禮品券內容
			// $scope.calcPriceSaved().then(function(data) {
			// }, function(err) {
			// 	$scope.cross_obj.is_submitted = false;
			// 	alert(err)
			// }); 
			

			// Step 5. 根據不同配送 付款方式，產生相對應後送動作
			if(shipment_method == SHIPPING_NAME.ship_to_home) {
				$scope.shipping_info.country_d = _.find($scope.country_coll, {country_id: $scope.shipping_info.country_id});
				$scope.shipping_info.city_d = _.find($scope.city_coll, {zone_id: $scope.shipping_info.city_id});
				$scope.shipping_info.district_d = _.find($scope.district_coll, {district_id: $scope.shipping_info.district_id});
				$scope.shipping_info.sub_district_d = _.find($scope.sub_district_coll, {sub_district_id: $scope.shipping_info.sub_district_id});

			}
			shipping_promise = Shipment.setShipToHome($scope.cart, $scope.shipping_info, payment_method);

			// Step 5-1. 先處理配送方式，回傳訂單編號
			shipping_promise.then(function(resp_new_order_id) {
				console.log('完成配送方式');
				payment_promise = Payment.setPayByAlipay(resp_new_order_id);

				// Step 5-2. 再處理付款方式，回傳訂單狀態與訂單編號
				payment_promise.then(function(datas) {
					var checkout_result = datas;
					if(payment_method == PAYMENT_NAME.alipay) {
						$scope.alipay_form_html = $sce.trustAsHtml(checkout_result);
					} else {
						$location.path('/checkout/success').search({order_id: checkout_result.order_id}).hash('');
					}
				}, function(err) {
					$scope.cross_obj.is_submitted = false;
					console.log('完成付款部分: ' + err);
					$state.go('failure');
				});
			}, function(err) {
				$scope.cross_obj.is_submitted = false;
				console.log(err);
				$state.go('failure');
			});
		};
	});
