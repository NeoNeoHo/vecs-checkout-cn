'use strict';

angular.module('webApp')
	.controller('CheckoutController', function ($rootScope, $scope, $window, $state, $document, $location, $cookies, $sce, $http, $q, User, Auth,  Location, Shipment, Payment, Promotion, Cart, Customer, Reward, Product, Config) {
		$rootScope.$state = $state;
		$rootScope.$on('$stateChangeSuccess', function() {
   			var someElement = angular.element(document.getElementById('form-container'));
    		$document.scrollToElementAnimated(someElement, 0, 800);
		});
		console.log('get token check!!');
		console.log($cookies.get('vecs_token'));
		$scope.currentUser = $scope.currentUser || Auth.getCurrentUser();
		$scope.allow_amount = $scope.allow_amount || _.range(1,20);
		var SHIPMENT_EZSHIP_FEE = Config.SHIPPING_FEE.EZSHIP;
		var SHIPMENT_HOME_FEE = Config.SHIPPING_FEE.HOME;
		var SHIPMENT_OVERSEAS_FEE = Config.SHIPPING_FEE.OVERSEAS;
		var FREESHIPPING_FEE = Config.FREE_SHIPPING_CONDICTION.EZSHIP;
		var FREESHIPPING_OVERSEAS_FEE = Config.FREE_SHIPPING_CONDICTION.OVERSEAS;
		$scope.EZSHIP_PRICE_UPPER_BOUND = Config.EZSHIP_PRICE_UPPER_BOUND;

		var SHIPPING_NAME = Config.SHIPPING_NAME;
		var PAYMENT_NAME = Config.PAYMENT_NAME;
		$scope.SHIPPING_NAME = SHIPPING_NAME;
		$scope.PAYMENT_NAME = PAYMENT_NAME;
		$scope.is_address_valid = $scope.is_address_valid || true;

		$scope.cross_obj = {
			temp_reward_use: '', 
			DIR_DOMAIN: Config.DIR_DOMAIN,
			is_submitted: false
		};

		$scope.shipping_info = $scope.shipping_info || {
			firstname: '',
			telephone: '',
			country_id: 206,
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
			});
			if(!$scope.shipping_info.address) {
				getAddress();
			}
			Reward.getFromCustomer().then(function(reward) {
				$scope.cart.rewards_customer_has_pts = (reward.points) ? reward.points : 0;
				$scope.cart.rewards_available = ($scope.cart.total_price_with_discount > $scope.cart.rewards_customer_has_pts) ? $scope.cart.rewards_customer_has_pts : $scope.cart.total_price_with_discount;
			}, function(err) {
				console.log(err.data);
				$scope.cart.rewards_customer_has_pts = 0;
				$scope.cart.rewards_available = 0;
				// $state.go('failure');
			});
			var searchUrlObject = $location.search();
			if(_.has(searchUrlObject, 'shipment') && searchUrlObject.shipment == 'ship_to_store') {
				$scope.shipping_info.shipment_sel_str = SHIPPING_NAME.ship_to_store;
				$scope.setPaymentMethod(SHIPPING_NAME.ship_to_store);
			}

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
				$state.go('checkout.shipment_payment');
			} else {
				console.log($scope.checkout_form.$valid);
			}
		};
		$scope.checkout_third_step = function() {
			if(lstrcmp([SHIPPING_NAME.ship_to_home,SHIPPING_NAME.ship_to_overseas], $scope.shipping_info.shipment_sel_str)) {
				$scope.is_address_valid = $scope.shipping_info.city_d && $scope.shipping_info.address;
			}
			if($scope.shipping_info.shipment_sel_str === SHIPPING_NAME.ship_to_store) {
				$scope.is_address_valid = $scope.shipping_info.ezship_store_info;
			}
			if($scope.checkout_form.$valid && $scope.is_address_valid){
				$state.go('checkout.final_confirm');
			} else {
				$scope.is_address_valid = false;
				console.log($scope.checkout_form.$valid);
			}
		};

		$scope.store_select_text = '選擇超商門市';


		$scope.payment_btn = {
			store_pay: true,
			hand_pay: true,
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
		};

		$scope.removeProduct = function(key='') {
			$scope.cart.products = _.reject($scope.cart.products, {key: key});
			$scope.updateCartTotal();
			if($scope.cart.discount.coupon.saved_amount > 0) {
				$scope.calcCouponSaved();
			}
			return true;
		};

		$scope.setEzshipStore = function(order_id) {
			order_id = order_id ? order_id : 999999999;
			Shipment.setEzshipStore(order_id);
		};

		$scope.setCities = function(country_id) {
			$scope.with_city_ready = false;
			if($scope.country_coll) {
				$scope.shipping_info.country_d = _.find($scope.country_coll, {country_id: $scope.shipping_info.country_id});
			}
			Location.getCities(country_id).then(function(result) {
				$scope.city_coll = result.cities;
				$scope.with_city_ready = true;
			}, function(err) {
				console.log(err);
			});
		};

		$scope.setDistricts = function(city_id) {
			$scope.with_district_ready = false;
			if($scope.city_coll){
				$scope.shipping_info.city_d = _.find($scope.city_coll, {zone_id: city_id});
			}
			Location.getDistricts(city_id).then(function(result) {
				$scope.district_coll = result.districts;
				$scope.with_district_ready = true;
			}, function(err) {
				console.log(err);
			});		
		};

		$scope.setDistrictName = function(district_id) {
			if($scope.district_coll) {
				$scope.shipping_info.district_d = _.find($scope.district_coll, {district_id: district_id});
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
					console.log('This is customer address: ');
					$scope.shipping_info.city_id = (data.zone_id) ? data.zone_id : 0;
					$scope.shipping_info.city_d = {zone_id: data.zone_id, name: data.city_name};
					$scope.setDistricts((data.zone_id) ? data.zone_id : '');

					$scope.shipping_info.country_id = (data.country_id) ? data.country_id : 0;
					$scope.shipping_info.country_d = {country_id: data.country_id, name: data.country_name};
					$scope.setCities((data.country_id) ? data.country_id : 206);

					$scope.shipping_info.district_id = (data.district_id) ? data.district_id : 0;
					$scope.shipping_info.district_d = {district_id: data.district_id, name: data.district_name, postcode: data.postcode};
					$scope.shipping_info.address = data.address_1 ? data.address_1 : '';
				}
			}, function(err) {
				console.log(err);
				// $state.go('failure');
			});
		};

		$scope.setPaymentMethod = function(lmethod) {
			$scope.shipping_info.shipment_sel_str = lmethod;
			$scope.shipping_info.payment_sel_str = null;
			$scope.shipping_info.country_id = 206;
			$scope.payment_btn.store_pay = (lstrcmp([SHIPPING_NAME.ship_to_store], lmethod)) ? true : false;
			$scope.payment_btn.hand_pay = (lstrcmp([SHIPPING_NAME.ship_to_home], lmethod)) ? true : false;
			$scope.payment_btn.alipay = (lstrcmp([SHIPPING_NAME.ship_to_home,SHIPPING_NAME.ship_to_overseas, SHIPPING_NAME.ship_to_store], lmethod)) ? true : false;

			
			var total_price_with_discount = $scope.cart.product_total_price - $scope.cart.discount.reward.saved_amount - $scope.cart.discount.coupon.saved_amount;
			if(lmethod === SHIPPING_NAME.ship_to_home) {
				$scope.shipping_info.country_id = 206;
				$scope.setCities(206);
				$scope.cart.shipment_fee = (total_price_with_discount >= FREESHIPPING_FEE) ? 0 : SHIPMENT_HOME_FEE;
			}
			if(lmethod === SHIPPING_NAME.ship_to_store) {
				$scope.cart.shipment_fee = (total_price_with_discount >= FREESHIPPING_FEE) ? 0 : SHIPMENT_EZSHIP_FEE;
			}
			if(lmethod === SHIPPING_NAME.ship_to_overseas) {
				$scope.cart.shipment_fee = (total_price_with_discount >= FREESHIPPING_OVERSEAS_FEE) ? 0 : SHIPMENT_OVERSEAS_FEE;
				Location.getCountries().then(function(result) {
					$scope.country_coll = result;
					$scope.with_city_ready = false;
				}, function(err) {
					// $state.go('failure');
				});
			}
			$scope.shipping_info.shipment_fee = $scope.cart.shipment_fee;
		};
		$scope.getEzshipStore = function() {
			Shipment.getEzshipStore().then(function(data) {
				console.log('This is ezship store info: ');
				$scope.store_select_text = '重新選擇超商';
				$scope.ezship_store_info = data;
				$scope.shipping_info.ezship_store_info = data;
			}, function(err) {
				$scope.ezship_store_info = null;
			});
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

		$scope.calcVoucherSaved = function() {
			console.log('calcVoucherSaved');
			var defer = $q.defer();
			Promotion.calcVoucherSaved($scope.cart.discount.voucher.name, $scope.cart).then(function(resp_voucher) {
				$scope.cart.discount.voucher = resp_voucher;
				$scope.cart.total_price_with_discount = getDiscountPrice();
				$scope.cart.rewards_available = getAvailableReward();
				defer.resolve();
			}, function(err) {
				alert(err);
				$scope.cart.discount.voucher.saved_amount = 0;
				$scope.cart.discount.voucher.name = '';
				$scope.cart.total_price_with_discount = getDiscountPrice();
				$scope.cart.rewards_available = getAvailableReward();
				defer.reject(err);
			});
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
				alert('請檢查結帳資訊，謝謝');
				$scope.cross_obj.is_submitted = false;
				$scope.checkout_second_step();
				return 0;
			}

			var shipping_promise = [];
			var payment_promise = [];
			var shipment_method = $scope.shipping_info.shipment_sel_str;
			var payment_method = $scope.shipping_info.payment_sel_str;
			var customer_to_update = {
				firstname: $scope.shipping_info.firstname,
				lastname: '',
				telephone: $scope.shipping_info.telephone
			};

			// Step 1. 更新用戶資料
			Customer.updateCustomer(customer_to_update).then(function(result) {}, function(err){console.log(err);});
			
			// Step 2. 檢查商品資訊是否有被篡改 
			Product.validateProducts($scope.cart.products).then(function(data) {
				console.log(data);
			}, function(err) {
				console.log(err);
				$scope.cross_obj.is_submitted = false;
				alert('商品價格及紅利點數有異，請洽客服人員，謝謝');
				$scope.checkout_first_step();
				return 0;
			});

			// Step 3. 檢查優惠內容與禮品券內容
			// $scope.calcPriceSaved().then(function(data) {
			// }, function(err) {
			// 	$scope.cross_obj.is_submitted = false;
			// 	alert(err)
			// }); 
			

			// Step 5. 根據不同配送 付款方式，產生相對應後送動作
			if(lstrcmp([SHIPPING_NAME.ship_to_home, SHIPPING_NAME.ship_to_overseas], shipment_method)) {
				$scope.shipping_info.country_d = _.find($scope.country_coll, {country_id: $scope.shipping_info.country_id});
				$scope.shipping_info.city_d = _.find($scope.city_coll, {zone_id: $scope.shipping_info.city_id});
				$scope.shipping_info.district_d = _.find($scope.district_coll, {district_id: $scope.shipping_info.district_id});
			}

			switch (shipment_method) {
				case SHIPPING_NAME.ship_to_home:
					shipping_promise = Shipment.setShipToHome($scope.cart, $scope.shipping_info, payment_method);
					break;
				case SHIPPING_NAME.ship_to_overseas:
					shipping_promise = Shipment.setShipToOverseas($scope.cart, $scope.shipping_info, payment_method);
					break;
				case SHIPPING_NAME.ship_to_store:
					shipping_promise = Shipment.setShipToEzship($scope.cart, $scope.shipping_info, payment_method);
					break;
				default:
					alert('請檢查配送方式，謝謝');
					$scope.cross_obj.is_submitted = false;
					$scope.checkout_second_step();
					return 0;
					break;
			}

			// Step 5-1. 先處理配送方式，回傳訂單編號
			shipping_promise.then(function(resp_new_order_id) {
				console.log('完成配送方式');

				switch (payment_method) {
					case PAYMENT_NAME.hand_pay:
						payment_promise = Payment.setPayOnDeliver(resp_new_order_id);
						break;
					case PAYMENT_NAME.store_pay:
						payment_promise = Payment.setPayOnStore(resp_new_order_id);
						break;
					case PAYMENT_NAME.alipay:
						payment_promise = Payment.setPayByAlipay(resp_new_order_id);
						break;
					default:
						alert('請檢查付款方式，謝謝');
						$scope.cross_obj.is_submitted = false;
						$scope.checkout_second_step();
						return 0;
						break;						
				}

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
		$scope.getEzshipStore();
		if($window.innerWidth <= 768){
			$scope.form_action = $sce.trustAsResourceUrl("https://sslpayment.uwccb.com.tw/EPOSService/Payment/Mobile/OrderInitial.aspx");
		} else {
			$scope.form_action = $sce.trustAsResourceUrl("https://sslpayment.uwccb.com.tw/EPOSService/Payment/OrderInitial.aspx");
		}
	});
