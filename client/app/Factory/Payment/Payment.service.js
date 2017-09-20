'use strict';

angular.module('webApp')
	.factory('Payment', function ($http, $q, $filter, Location, Order, Config, $window) {
		// Service logic
		// ...
		var PAY_ON_DELIVER_METHOD = Config.PAYMENT_NAME.hand_pay;
		var PAY_ON_DELIVER_SUCCESS_ORDER_STATUS_ID = 55;

		var PAY_ON_STORE_METHOD = Config.PAYMENT_NAME.store_pay;
		var PAY_ON_STORE_SUCCESS_ORDER_STATUS_ID = 58;

		var PAY_BY_ALIPAY_METHOD = Config.PAYMENT_NAME.alipay;
		var PAY_BY_ALIPAY_STATUS_coll = [
			{shipping_method: Config.SHIPPING_NAME.ship_to_home, confirm_status_id: 66, success_status_id: 67},
			{shipping_method: Config.SHIPPING_NAME.ship_to_store, confirm_status_id: 56, success_status_id: 57},
			{shipping_method: Config.SHIPPING_NAME.ship_to_overseas, confirm_status_id: 59, success_status_id: 60}
		];

		var getAliDirectPaySubmitForm = function(order_id) {
			var defer = $q.defer();
			var url = '';
			if($window.innerWidth <= 768){
				url = '/api/alipays/wap/'+order_id;
			} else {
				url = '/api/alipays/'+order_id;
			}
			$http.get(url).then(function(data) { //order_id: 36758
				defer.resolve(data.data);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};


		var setPayOnDeliver = function(order_id) {
			var defer = $q.defer();
			var promises = [];
			var update_dict = {
				payment_method: PAY_ON_DELIVER_METHOD,
				order_status_id: PAY_ON_DELIVER_SUCCESS_ORDER_STATUS_ID
			};

			var insert_dict = {
				order_id: order_id,
				order_status_id: PAY_ON_DELIVER_SUCCESS_ORDER_STATUS_ID,
				notify: 0,
				comment:'系統自動更新',
				date_added: new Date()
			}
			promises.push(Order.updateOrder(order_id, update_dict));
			promises.push(Order.insertOrderHistory(order_id, insert_dict));
			$q.all(promises).then(function(datas) {
				Order.sendOrderSucessMail(order_id);
				defer.resolve({checkout_status: 1, order_id: order_id});
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var setPayOnStore = function(order_id) {
			var defer = $q.defer();
			var promises = [];
			var update_dict = {
				payment_method: PAY_ON_STORE_METHOD,
				order_status_id: PAY_ON_STORE_SUCCESS_ORDER_STATUS_ID
			};
			var insert_dict = {
				order_id: order_id,
				order_status_id: PAY_ON_STORE_SUCCESS_ORDER_STATUS_ID,
				notify: 0,
				comment:'系統自動更新',
				date_added: new Date()
			}
			promises.push(Order.updateOrder(order_id, update_dict));
			promises.push(Order.insertOrderHistory(order_id, insert_dict));
			$q.all(promises).then(function(datas) {
				Order.sendOrderSucessMail(order_id);
				defer.resolve({checkout_status: 1, order_id: order_id});
			}, function(err) {
				
				defer.reject(err);
			});
			return defer.promise;
		};


		//支付宝即时到帐交易接口
		var setPayByAlipay = function(order_id) {
			var defer = $q.defer();
			Order.getOrder(order_id).then(function(orders) {
				var order = orders[0];
				var shipping_method = order.shipping_method;
				var matched_shipping_method = _.find(PAY_BY_ALIPAY_STATUS_coll, {shipping_method: shipping_method})
				var confirm_order_status_id = matched_shipping_method ? matched_shipping_method.confirm_status_id : 0;

				var update_dict = {
					payment_method: PAY_BY_ALIPAY_METHOD,
					order_status_id: confirm_order_status_id
				};
				Order.updateOrder(order_id, update_dict).then(function(data) {
					getAliDirectPaySubmitForm(order_id).then(function(html_form) {
						defer.resolve(html_form);
					}, function(err) {
						console.log(err);
						defer.reject(err);
					});					
				}, function(err) {
					console.log(err);
					defer.reject(err);
				});
			});
			return defer.promise;
		};


		// Public API here
		return {
			setPayOnDeliver: setPayOnDeliver,
			setPayOnStore: setPayOnStore,
			setPayByAlipay: setPayByAlipay
		};
	});
