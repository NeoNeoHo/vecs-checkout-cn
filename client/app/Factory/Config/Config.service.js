'use strict';

angular.module('webApp')
	.factory('Config', function ($q, $http) {
		// var DIR_IMAGE_PATH = 'https://www.vecsgardenia.com/image';
		var DIR_IMAGE_PATH = 'http://vecs-gardenia.com.cn/image';

		var DIR_COOKIES = 'vecs-gardenia.com.cn';
		// var DIR_COOKIES = 'vecsgardenia.com';
		// var DIR_COOKIES = '61.220.72.50';
		// var DIR_COOKIES = 'localhost';

		var DIR_DOMAIN = 'http://' + DIR_COOKIES;
		// var DIR_DOMAIN = 'https://' + DIR_COOKIES;
		
		var DIR_NODE_SUBDOMAIN = 'http://checkout.' + DIR_COOKIES;
		// var DIR_NODE_SUBDOMAIN = 'https://checkout.' + DIR_COOKIES;
		// var DIR_NODE_SUBDOMAIN = 'http:' + DIR_COOKIES + ':9001';
		
		

		var SHIPPING_FEE = {
			EZSHIP: 20,
			HOME: 20,
		};

		var FREE_SHIPPING_CONDICTION = {
			EZSHIP: 200,
			HOME: 200,
			OVERSEAS: 5000
		};

		var EZSHIP_PRICE_UPPER_BOUND = 6000;

		var PAYMENT_NAME = {
			store_pay: '超商付現',
			hand_pay: '貨到付款',
			alipay: '支付宝'
		};

		var SHIPPING_NAME = {
			ship_to_home: '送货到府',
			ship_to_overseas: '海外配送',
			ship_to_store: '超商取貨'
		};

		var ORDER_STATUS_def = {
			_created: [54, 55, 57, 58, 60],
			_shipped: [20, 28, 32, 42],
			_received: [21, 29, 34],
			_failed: [10, 50, 51, 52, 53, 56, 59],
			_returned: [45, 46]
		};

		// Public API here
		return {
			DIR_IMAGE_PATH: DIR_IMAGE_PATH,
			DIR_COOKIES: DIR_COOKIES,
			DIR_DOMAIN: DIR_DOMAIN,
			DIR_NODE_SUBDOMAIN: DIR_NODE_SUBDOMAIN,
			SHIPPING_FEE: SHIPPING_FEE,
			FREE_SHIPPING_CONDICTION: FREE_SHIPPING_CONDICTION,
			PAYMENT_NAME: PAYMENT_NAME,
			SHIPPING_NAME: SHIPPING_NAME,
			ORDER_STATUS_def: ORDER_STATUS_def,
			EZSHIP_PRICE_UPPER_BOUND: EZSHIP_PRICE_UPPER_BOUND
		};
	});
