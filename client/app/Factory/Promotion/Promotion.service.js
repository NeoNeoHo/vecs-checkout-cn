'use strict';

angular.module('webApp')
	.factory('Promotion', function ($q, $http, Reward) {
		// Service logic
		// ...

		var meaningOfLife = 42;
		var _buyXGetY = '';

		var getVoucher = function(voucher_name) {
			var defer = $q.defer();
			$http.get('/api/vouchers/'+voucher_name).then(function(data) {
				defer.resolve(data.data);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var getCoupon = function(couponNum) {
			var defer = $q.defer();
			$http.get('/api/coupons/'+couponNum).then(function(data) {
				console.log('getCoupon');
				defer.resolve(data.data);
			}, function(err) {
				defer.reject(err.data);
			});
			return defer.promise;
		}

		var _calcCouponSaved = function(couponNum, cart) {
			var defer = $q.defer();
			getCoupon(couponNum).then(function(data) {
				if(data.status == false) {
					defer.reject({status:500, data: '沒有此一折扣碼，或此優惠碼已過期'});
				} else if(data.status != true) {
					defer.reject({status:500, data: data.status});
				}
				var resolve_data = {
					promotion_total: 0
				};
				var _categories_to_products_coll = data.categories_to_products;
				var _products_coll = data.products;
				var _qualified_products_coll = _.union(_categories_to_products_coll, _products_coll);
				var _discount_fee = data.setting.discount;   // discount: for type F -> amount to discount; for type P -> amount of pct to discount
				var _discount_type = data.setting.type;  // type: F -> fix; P -> percentage
				var _coupon_saved_amount = 0;
				var _qualified_total = data.setting.total || 0;

				// Check If Coupon Content Has Weird Discount
				if(_discount_type === 'P' && _discount_fee >= 60) {
					var lerr = {status: 500, data: '此折購碼優惠折扣異常，請洽客服02-23623827！！'};
					defer.reject(lerr);
				}

				// Check if cart total is qualified for this coupon to apply
				if(cart.product_total_price >=  _qualified_total) {
					// Directly Apply Coupon If No Any Category or Product Limitation
					// Or
					// Apply to those qualified Products
					if(_qualified_products_coll.length === 0) {
						try {
							if(cart.discount.promotion) {
								var promotion_deduct_amount = cart.discount.promotion.saved_amount;
								_coupon_saved_amount = (_discount_type === 'F') ? _discount_fee : Math.round((cart.product_total_price-promotion_deduct_amount) * _discount_fee / 100);
							} else {
								_coupon_saved_amount = (_discount_type === 'F') ? _discount_fee : Math.round(cart.product_total_price * _discount_fee / 100);
							}
						} catch (e) {

						}
					} else {
						_coupon_saved_amount = _.reduce(cart.products, function(lcoupon_saved_amount, lproduct) {
							if(_.find(_qualified_products_coll, {'product_id': lproduct.product_id})) {
								lcoupon_saved_amount += (_discount_type === 'P') ? Math.round(lproduct.total * _discount_fee / 100) : -1;  // '-1' is a trick for type F discount
							}
							return lcoupon_saved_amount;
						}, 0);
						if(_discount_type === 'F' && _coupon_saved_amount < 0) {
							_coupon_saved_amount = _discount_fee;
						}
					}
				}
				resolve_data = {
					coupon_saved_amount: _coupon_saved_amount,
					coupon_id: data.setting.coupon_id
				};

				defer.resolve(resolve_data);

			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		}


		var calcRewardSaved = function(reward_used_pts, cart) {
			console.log('calcRewardSaved');
			var defer = $q.defer();
			if(reward_used_pts <= 0) {
				defer.resolve({saved_amount: 0, name: ''});
			} else {
				Reward.getFromCustomer().then(function(reward) {
					var rewards = (reward.points) ? reward.points : 0;
					if(reward_used_pts > rewards){
						defer.reject('您並無這麼多的紅利點數喔');
					} else {
						if(reward_used_pts <= cart.product_total_price - cart.discount.coupon.saved_amount - cart.discount.voucher.saved_amount) {
							defer.resolve({saved_amount: reward_used_pts, name: ''});
						} else {
							defer.resolve({saved_amount: cart.product_total_price - cart.discount.coupon.saved_amount - cart.discount.voucher.saved_amount, name: ''});
						}
					}
				}, function(err) {
					defer.reject(err.data);
				});
			}
			return defer.promise;
		};

		var calcVoucherSaved = function(voucher_name, cart) {
			var defer = $q.defer();
			if(voucher_name === '') {
				defer.resolve({saved_amount: 0, name: ''});
			} else {
				getVoucher(voucher_name).then(function(data) {
					if(data.status == false) {
						defer.reject('查無此禮品券，請撥打客服專線 02-23623827詢問');
					}
					if(data.available_amount <= 0) {
						defer.reject(voucher_name + '禮品券已無現金點數');
					} else {
						var available_amount = data.available_amount; 
						var voucher_max_amount = (available_amount >= cart.total_price_with_discount) ? (cart.total_price_with_discount) : available_amount;
						defer.resolve({saved_amount: voucher_max_amount, name: voucher_name, available_amount: available_amount, id: data.voucher_id})
					}
				}, function(err) {
					defer.reject(err.data);
				});
			}
			return defer.promise;
		};

		var calcCouponSaved = function(coupon_name, cart) {
			var defer = $q.defer();
			if(coupon_name === '') {
				defer.resolve({saved_amount: 0, name: '', id: 0});
			} else {
				_calcCouponSaved(coupon_name, cart).then(function(data) {
					if(data.coupon_saved_amount == 0) {
						defer.reject('您購買的商品並不適用此張優惠券');
					} else {
						defer.resolve({saved_amount: data.coupon_saved_amount, name: coupon_name, id: data.coupon_id});
					}
				}, function(err) {
					defer.reject(err.data);
				});
			}
			return defer.promise;
		};

		var getBuyXGetY = function() {
			var defer = $q.defer();
			if(_buyXGetY !== '') {
				defer.resolve(_buyXGetY);
			}
			var defer = $q.defer();
			$http.get('/api/promotions/buyXGetY').then(function(data) {
				_buyXGetY = data.data;
				defer.resolve(data.data);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;	
		};

		var calcBuyXGetYSaved = function (cart) {
			if(_buyXGetY === '' || _buyXGetY.status === false) {
				return {saved_amount: 0, name: ''};
			}
			var promo_qual_prod_ids = _buyXGetY.content.product_ids;
			var qual_products = [];
			var saved_amount = 0
			var total_qual_quantity = _.reduce(cart.products, function(lquantity, product) {
				if(promo_qual_prod_ids === 'all' || _.contains(promo_qual_prod_ids, product.product_id)) {
					for(let i = 0; i < product.quantity; i++) {
						qual_products.push(product);
					}
					return lquantity + product.quantity;
				} else {
					return lquantity;
				}
			}, 0);
			if(_buyXGetY.content.X > total_qual_quantity) {
				return {saved_amount: 0, name: ''};
			}
			var discount_quantity = (parseInt(total_qual_quantity / parseInt(_buyXGetY.content.X+1))) * _buyXGetY.content.Y;
			qual_products = _.sortBy(qual_products, 'spot_price');
			for(let j = 0; j < discount_quantity; j++) {
				saved_amount += qual_products[j].spot_price;
			}
			return {saved_amount: Math.round(saved_amount), name: _buyXGetY.content.description};
		};
		
		// Public API here
		return {
			someMethod: function () {
				return meaningOfLife;
			},
			getCoupon: getCoupon,
			calcCouponSaved: calcCouponSaved,
			calcVoucherSaved: calcVoucherSaved,
			calcRewardSaved: calcRewardSaved,
			getVoucher: getVoucher,
			getBuyXGetY: getBuyXGetY,
			calcBuyXGetYSaved: calcBuyXGetYSaved
		};
	});
