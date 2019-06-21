 'use strict';

angular.module('webApp')
	.factory('Cart', function ($q, $http, Config, $cookies, Product, Promotion) {
		var cart_cache = '';
		// const _random_ = Math.floor((Math.random() * 10) + 1);

		var _random_ = 0;

		if($cookies.get('vg_gift_t')) {
			_random_ = $cookies.get('vg_gift_t')
		} else {
			_random_ = Math.floor((Math.random() * 10) + 1);
			var expireDate = new Date();
  		expireDate.setDate(expireDate.getDate() + 1);
			$cookies.put('vg_gift_t', _random_, {expires: expireDate});
		}

		var checkDiscount = function(cart) {
			cart.products = _.map(cart.products, function(product) {
				var discounts = product.discount;
				if(_.size(discounts) > 0) {
					var discount_available = _.sortBy(_.filter(discounts, function(discount) {
						return discount.quantity <= product.quantity;
					}), 'quantity');
					product.spot_price = (discount_available.length) ? discount_available[discount_available.length - 1].price : product.price.special_price;
				}
				return product;
			});
			return cart;		
		};

		var updateProductTotal = function(cart) {
			cart.products = _.map(cart.products, function(product) {
				product.total = (product.spot_price + product.option_price) * product.quantity;
				return product;
			});
			return cart;
		};

		var clearCartCookieSession = function() {
			var defer = $q.defer();
			$cookies.remove('vecs_cart', {domain: Config.DIR_COOKIES});
			// $cookies.remove('vecs_token', {domain: Config.DIR_COOKIES});
			$cookies.remove('vecs_reward', {domain: Config.DIR_COOKIES});
			$cookies.remove('vecs_coupon', {domain: Config.DIR_COOKIES});
			$cookies.remove('vecs_voucher', {domain: Config.DIR_COOKIES});
			$http.delete('/api/carts/session/').then(function(result) {
				defer.resolve(result);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var updateSession = function(cart_products) {
			var defer = $q.defer();
			var update_products = _.map(cart_products, function(product) {
				if(product.key) {
					return {product_key: product.key, quantity: product.quantity};
				} else {
					defer.reject('no product key');
				}
			});
			
			$http.put('/api/carts/session/', {update_products: update_products})
			.then(function(result) {
				defer.resolve(result);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var updateCartCookiesSession = function(products) {
			var defer = $q.defer();
			products = _.map(products, function(product) {
				return _.pick(product, ['key', 'option', 'product_id', 'quantity', 'href', 'thumb']);
			});
			$cookies.put('vecs_cart', JSON.stringify(products), {domain: Config.DIR_COOKIES});
			updateSession(products).then(function(data) {
				defer.resolve(data);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};
		
		var _calcBuyXGetYSaved = function(cart) {
			var resp_promotion = Promotion.calcBuyXGetYSaved(cart);
			cart.discount.promotion = resp_promotion;
			cart = checkDiscount(cart);
			return cart;
		};
		var _calcBuySameCategory_X_BundlePrice_PSaved = function(cart) {
			var resp_promotions = Promotion.calcBuySameCategory_X_BundlePrice_PSaved(cart);
			console.log('通過任選Ｘ件Y元計算');
			console.log(resp_promotions);
			_.forEach(resp_promotions, (resp_promotion) => {
				if(!_.find(cart.discount.promotions, {'name': resp_promotion.name})){
					if(resp_promotion.name) {
						cart.discount.promotions.push(resp_promotion);
					}
				} else {
					cart.discount.promotions = _.map(cart.discount.promotions, (promotion) => {
						if(promotion.name === resp_promotion.name) {
							promotion = resp_promotion;
						}
						return promotion;
					});				
				}
			});
			return cart;
		};
		var updateCartTotal = function(cart) {
			// cart = _calcBuyXGetYSaved(cart);
			cart = _calcBuySameCategory_X_BundlePrice_PSaved(cart);
			cart = checkDiscount(cart);
			cart = updateProductTotal(cart);
			cart.product_total_price = _.reduce(cart.products, function(sum, o){return sum+o.total}, 0);
			console.log(cart);
			updateCartCookiesSession(cart.products);
			return cart;
		};
		var getSession = function() {
			var defer = $q.defer();
			$http.get('/api/carts/session/')
			.then(function(result) {
				// console.log(result);
				defer.resolve(result);
			}, function(err) {
				console.log(err);
				defer.reject(err);
			});
			return defer.promise;
		};
		var getCart = function() {
			var defer = $q.defer();
			getSession().then(function(result) {
				var cart_cookies = result.data.cart;

				var clean_cart_cookies = _.map(cart_cookies, function(lproduct) {
					lproduct.product_id = parseInt(lproduct.product_id);
					return lproduct;
				});
				var lcart = {
					products: clean_cart_cookies,
					product_total_price: _.reduce(cart_cookies, function(sum, o){return sum+o.price*o.quantity}, 0),
					discount: {
						reward: {
							saved_amount: 0,
							name: ''
						},
						coupon: {
							saved_amount: 0,
							name: '',
							id: 0
						},
						voucher: {
							saved_amount: 0,
							name: '',
							id: 0,
							available_amount: 0
						},
						promotions: []
					},
					shipment_fee: 0,
				};

				Product.getProductsDetail(lcart.products).then(function(db_products) {
					lcart.products = _.map(lcart.products, function(product) {
						var db_product = _.find(db_products, {product_id: product.product_id});
						if(db_product) {
							product.price = db_product.price;
							product.discount = db_product.discount || [];
							product.reward = db_product.reward;
							product.model = db_product.model;
							product.name = db_product.name;
							product.image = db_product.image;
							product.maximum = (db_product.maximum > 0) ? _.range(1,db_product.maximum+1) : _.range(1,20); 
							product.spot_price = product.price.special_price;
							product.option_price = _.reduce(_.pluck(product.option, 'price'), function(sum, num){return sum+num;}, 0);
							
							product.total = (product.spot_price + product.option_price) * product.quantity;
						} else {
							alert('注意！某項商品已無庫存囉，請選擇關閉此視窗，繼續結帳下一步，或是回到首頁，聯絡線上客服');
							product = {};
						}
						return product;
					});
					lcart = updateCartTotal(lcart);

					// 先計算買X送Y折Z的優惠，然後才加上紅利與Coupon的優惠
					var promotion_promise = [];
					// promotion_promise.push(Promotion.getBuyXLastOneYOff());
					promotion_promise.push(Promotion.getBuySameCategory_X_BundlePrice_P(cart));
					$q.all(promotion_promise)
						.then(function(promotion_datas) {
							// _calcBuyXLastOneYOffSaved();
							// lcart = _calcBuyXGetYSaved(lcart);
							lcart = _calcBuySameCategory_X_BundlePrice_PSaved(lcart);
							defer.resolve(lcart);
						}).catch(function(err) {
							defer.reject(err);
						});
				}, function(err) {
					defer.reject(err);
				});
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};



		var clear = function() {
			// console.log('Clear Cart');
			clearCartCookieSession();
			// window.location.href = Config.SERVER_HOST + '/index.php?route=checkout/cart/clear';
		};


		var addGiftWithPurchase = function(lcart) {
			var defer = $q.defer();
			const price_after_discount = lcart.product_total_price - lcart.discount.reward.saved_amount - lcart.discount.coupon.saved_amount - lcart.discount.voucher.saved_amount - _.reduce(lcart.discount.promotions, (lsum, promotion) => {return lsum+promotion.saved_amount}, 0);
			lcart.giftWithPurchase = [];

			// /* This is usual Campaign Area */
			// Product.getGifts([454, 455]).then(function(gifts){
			// 	// product: 420, 125，護唇膏
			// 	// product: 403，小角鯊
			// 	if(price_after_discount >= 600 && gifts[0].quantity > 1) {
			// 		lcart.giftWithPurchase.push(_mapGoodFormGift(gifts[0]));
			// 	}
			// 	if(price_after_discount >= 1200 && gifts[1].quantity > 1) {
			// 		lcart.giftWithPurchase.push(_mapGoodFormGift(gifts[1]));
			// 	}
			// 	defer.resolve(lcart);				
			// }, function(err) {
			// 	defer.resolve(lcart);
			// });


			// 柑橘複方植萃護手霜，product_id: 367
			// 檸檬複方植萃護手霜，product_id: 239
			// 玫瑰角鯊植萃護手霜，product_id: 368
			// 薰衣草植萃護手霜，product_id: 467

			// Product.getGifts([272, 421]).then(function(gifts) {
			// 	lcart.giftWithPurchase = [];
			// 	if(price_after_discount >= 450) {
			// 		if(gifts[0].quantity > 1) {
			// 			lcart.giftWithPurchase.push(_mapGoodFormGift(gifts[0]));
			// 		}			
			// 	}
			// 	if(price_after_discount >= 600) {	
			// 		if(gifts[1].quantity > 1) {
			// 			lcart.giftWithPurchase.push(_mapGoodFormGift(gifts[1]));
			// 		}			
			// 	}
				// if(price_after_discount >= 800) {
				// 	if(gifts[2].quantity > 1) {
				// 		lcart.giftWithPurchase.push(_mapGoodFormGift(gifts[2]));
				// 	}			
				// }

				// if(price_after_discount >= 300) {
				// 	var _random_gifts = [];
				// 	for(var i = 0; i < 4; i++) {
				// 		if(gifts[i].quantity > 1) {
				// 			_random_gifts.push(gifts[i]);
				// 		}
				// 	}
				// 	var _random_gifts_length = _random_gifts.length;
				// 	if(_random_gifts_length > 0) {
				// 		lcart.giftWithPurchase.push(_mapGoodFormGift(_random_gifts[_random_ % _random_gifts_length]));
				// 	}
				// }
				// if(price_after_discount >= 1000) {
				// 	if(gifts[4].quantity > 1) {
				// 		lcart.giftWithPurchase.push(_mapGoodFormGift(gifts[4]));
				// 	}			
				// }			
			// 	defer.resolve(lcart);				
			// }, function(err) {
			// 	defer.resolve(lcart);
			// });
			defer.resolve(lcart);
			return defer.promise;
		}

		var _mapGoodFormGift = function(gift_obj) {
			return {
				product_id: gift_obj.product_id,
				image: gift_obj.image,
				name: gift_obj.quantity < 10 ? `${gift_obj.name}，僅剩${gift_obj.quantity}個` : `${gift_obj.name}`	
			};
		}

		// Public API here
		return {
			getCart: getCart,
			updateCartTotal: updateCartTotal,
			updateSession: updateSession,
			clear: clear,
			getSession: getSession,
			addGiftWithPurchase: addGiftWithPurchase
		};
	});
