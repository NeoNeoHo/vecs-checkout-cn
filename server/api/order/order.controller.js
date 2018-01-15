/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/customers              ->  index
 * POST    /api/customers              ->  create
 * GET     /api/customers/:id          ->  show
 * PUT     /api/customers/:id          ->  update
 * DELETE  /api/customers/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import db_config from '../../config/db_config.js';
import api_config from '../../config/api_config.js';
import q from 'q';
import moment from 'moment';
var mysql_pool = db_config.mysql_pool;
var mysql_config = db_config.mysql_config;  

function respondWithResult(res, entity, statusCode) {
	statusCode = statusCode || 200;
	if (entity || entity[0]) {
		res.status(statusCode).json(entity);
	}
}

function handleEntityNotFound(res, entity) {
	if (!entity[0]) {
		res.status(404).end();
	}
}

function handleError(res, err, statusCode) {
	statusCode = statusCode || 500;
	res.status(statusCode).send(err);
}

var updateDictSql = function(table, update_dict, condition_dict) {
	var set_string = '';
	var where_string = '';
	_.forEach(_.pairs(update_dict), function(pair) {
		if(set_string.length == 0) {
			set_string = pair[0] + ' = ' + mysql_pool.escape(pair[1]);
		}
		else {
			set_string = set_string + ', ' + pair[0] + ' = ' + mysql_pool.escape(pair[1]);
		}
	});
	_.forEach(_.pairs(condition_dict), function(pair) {
		if(where_string.length == 0) {
			where_string = pair[0] + ' = ' + pair[1];
		}
		else {
			where_string = where_string + ' and ' + pair[0] + ' = ' + pair[1];
		}

	});
	var sql_string = 'update ' + table + ' set ' + set_string + ' where ' + where_string;
	return sql_string;
}

var insertDictSql = function(table, insert_dict) {
	var set_string = '';
	_.forEach(_.pairs(insert_dict), function(pair) {
		if(set_string.length == 0) {
			set_string = pair[0] + ' = ' + mysql_pool.escape(pair[1]);
		}
		else {
			set_string = set_string + ', ' + pair[0] + ' = ' + mysql_pool.escape(pair[1]);
		}
	});
	var sql_string = 'insert into ' + table + ' set ' + set_string;
	return sql_string;
}

var updateBulkSql = function(table, update_coll, condition_coll) {
	var sqls = '';
	for(var i = 0; i < _.size(update_coll); i++) {
		var sub_sql = updateDictSql(table, update_coll[i], condition_coll[i]);
		if(sqls.length == 0) {
			sqls = sub_sql;
		} else {
			sqls = sqls + '; ' + sub_sql;
		}
	}
	return sqls;
};

var insertBulkSql = function(table, insert_coll) {
	var sqls = '';
	_.forEach(insert_coll, function(insert_dict) {
		var sub_sql = insertDictSql(table, insert_dict);
		if(sqls.length == 0) {
			sqls = sub_sql;
		} else {
			sqls = sqls + '; ' + sub_sql;
		}
	});
	return sqls;
};


var createOrder = function(shipping_info, customer_id, customer_group_id, email, customer_ip) {
	var defer = q.defer();
	var order_dict = {
		'store_name': api_config.STORE_NAME,
		'store_url': api_config.STORE_URL,
		'invoice_prefix': '', 'invoice_filename': '', 'fax': '', 'custom_field': '',
		'customer_id': customer_id,
		'customer_group_id': customer_group_id,
		'firstname': shipping_info.firstname,
		'lastname': ' ',
		'email': email,
		'telephone': shipping_info.telephone,
		
		'shipping_firstname': shipping_info.shipping_firstname,
		'shipping_lastname': shipping_info.shipping_lastname,
		'shipping_company': shipping_info.company_id ? shipping_info.company_id : '',
		'shipping_address_1': shipping_info.address,
		'shipping_address_2': '',
		'shipping_country': shipping_info.country_d ? shipping_info.country_d.name : '中国',
		'shipping_country_id': shipping_info.country_id,
		'shipping_city': shipping_info.city_d ? shipping_info.city_d.name : '',
		'shipping_zone': shipping_info.city_d ? shipping_info.city_d.name : '',
		'shipping_zone_id': shipping_info.city_d ? shipping_info.city_d.zone_id : 0,
		'shipping_district': shipping_info.district_d ? shipping_info.district_d.name : '',
		'shipping_district_id': shipping_info.district_d ? shipping_info.district_d.district_id : 0,
		'shipping_sub_district': shipping_info.sub_district_d ? `${shipping_info.city_d.name},${shipping_info.district_d.name},${shipping_info.sub_district_d.name}` : `${shipping_info.city_d.name},${shipping_info.district_d.name}, `,
		'shipping_sub_district_id': shipping_info.sub_district_d ? shipping_info.sub_district_d.sub_district_id : 0,
		'shipping_postcode': shipping_info.sub_district_d ? shipping_info.sub_district_d.postcode : '',
		'shipping_method': shipping_info.shipping_method,
		'shipping_address_format': '', 'shipping_custom_field': '', 'shipping_code': '',

		'payment_firstname': shipping_info.shipping_firstname,
		'payment_lastname': shipping_info.shipping_lastname,
		'payment_company': shipping_info.company_id ? shipping_info.company_id : '',
		'payment_address_1': shipping_info.address,
		'payment_address_2': '',
		'payment_country': shipping_info.country_d ? shipping_info.country_d.name : '中国',
		'payment_country_id': shipping_info.country_id,
		'payment_city': shipping_info.city_d ? shipping_info.city_d.name : '',
		'payment_zone': shipping_info.city_d ? shipping_info.city_d.name : '',
		'payment_zone_id': shipping_info.city_d ? shipping_info.city_d.zone_id : 0,
		'payment_district': shipping_info.district_d ? shipping_info.district_d.name : '',
		'payment_district_id': shipping_info.district_d ? shipping_info.district_d.district_id : 0,
		'payment_postcode': shipping_info.sub_district_d ? shipping_info.sub_district_d.postcode : '',
		'payment_method': '', 
		'payment_address_format': '', 'payment_custom_field': '', 'payment_code': '',
		
		'affiliate_id': 0, 'commission': 0, 'marketing_id': 0, 'tracking': '', 'language_id': 2, 'currency_id': 4, 
		'forwarded_ip': '', 'user_agent': '', 'accept_language': '', 'balanced_document': '', 'date_invoice': 0,
		'comment': shipping_info.comment ? shipping_info.comment : '',
		'total': shipping_info.total,
		'order_status_id': shipping_info.order_status_id,
		'currency_code': 'TWD',
		'currency_value': 1,
		'ip': customer_ip,
		'date_added': new Date(),
		'date_modified': new Date(),
		'cto_printMark': shipping_info.sub_district_d ? shipping_info.sub_district_d.printMark : shipping_info.sub_district_d.name
	};		
	
	
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query('INSERT INTO oc_order SET ?;', order_dict, function(err, rows) {
			connection.release();
			if(err) {
				defer.reject(err);
			}
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

var createOrderHistory = function(order_id = 0, order_status_id = 0, notify = 0, comment = '') {
	var defer = q.defer();
	var insert_dict = {
		order_id: order_id,
		order_status_id: order_status_id,
		notify: notify,
		comment: comment,
		date_added: new Date()
	};
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query('INSERT INTO oc_order_history SET ?;', insert_dict, function(err, rows) {
			connection.release();
			if(err) {
				defer.reject(err);
			}
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

var createOrderProduct = function(order_id, cart) {
	var products = cart.products;
	var defer = q.defer();
	var insert_coll = [];
	insert_coll = _.map(products, function(product) {
		return {
			order_id: order_id,
			product_id: product.product_id,
			name: product.name,
			model: product.model,
			quantity: product.quantity,
			price: product.spot_price + product.option_price,
			total: (product.spot_price + product.option_price) * product.quantity,
			reward: product.reward * product.quantity
		};
	});
	if(_.size(cart.giftWithPurchase)) {
		_.forEach(cart.giftWithPurchase, function(gift) {
			insert_coll.push({
				order_id: order_id,
				product_id: gift.product_id,
				name: '滿額禮 - ' + gift.name,
				model: gift.name,
				quantity: 1,
				price: 0,
				total: 0,
				reward: 0				
			});
		});
	}
	var sql = insertBulkSql('oc_order_product', insert_coll);
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query(sql, function(err, rows) {
			connection.release();
			if(err) {
				defer.reject(err);
			}
			if(!Array.isArray(rows)) {
				defer.resolve([rows]);
			} else {
				defer.resolve(rows);
			}
		});
	});
	return defer.promise;
};

var reduceProductQuantity = function(cart) {
	var products = cart.products;
	var defer = q.defer();
	var update_sql = _.reduce(products, function(sql, product) {
		sql += 'update oc_product set quantity = quantity - ' + product.quantity + ' where product_id = ' + product.product_id + ';';
		return sql;
	}, '');
	if(_.size(cart.giftWithPurchase)) {
		_.forEach(cart.giftWithPurchase, function(gift) {
			update_sql += 'update oc_product set quantity = quantity - 1 where product_id = ' + gift.product_id + ';';
		});
	}
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query(update_sql, function(err, rows) {
			connection.release();
			if(err) {
				defer.reject(err);
			}
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

var increaseProductQuantity = function(cart) {
	var products = cart.products;
	var defer = q.defer();
	var update_sql = _.reduce(products, function(sql, product) {
		sql += 'update oc_product set quantity = quantity + ' + product.quantity + ' where product_id = ' + product.product_id + ';';
		return sql;
	}, '');
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query(update_sql, function(err, rows) {
			connection.release();
			if(err) {
				defer.reject(err);
			}
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

var createOrderOption = function(order_id, order_product_id, options) {
	var defer = q.defer();
	var insert_coll = [];
	insert_coll = _.map(options, function(option) {
		return {
			order_id: order_id,
			order_product_id: order_product_id,
			product_option_id: option.product_option_id,
			product_option_value_id: option.product_option_value_id,
			name: option.name,
			value: option.value,
			type: option.type
		};
	});
	var sql = insertBulkSql('oc_order_option', insert_coll);
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query(sql, function(err, rows) {
			connection.release();
			if(err) {
				defer.reject(err);
			}
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

var getOrderTotalDict = function(order_id, code, title, value, sort_order) {
	return {
		order_id: order_id,
		code: code,
		title: title,
		value: value,
		sort_order: sort_order
	};
};

// 注意，這裡有預先處理“禮品券”
var createOrderTotal = function(order_id = 0, shipping_info, cart) {
	var defer = q.defer();
	var insert_coll = [];
	insert_coll.push(getOrderTotalDict(order_id, 'sub_total', '商品總計', cart.product_total_price, 1));
	if(cart.discount.coupon.saved_amount > 0) insert_coll.push(getOrderTotalDict(order_id, 'coupon', '優惠券 - '+cart.discount.coupon.name, -cart.discount.coupon.saved_amount, 2));
	if(cart.discount.reward.saved_amount > 0) insert_coll.push(getOrderTotalDict(order_id, 'reward', '紅利點數 - '+cart.discount.reward.saved_amount, -cart.discount.reward.saved_amount, 3));
if(cart.discount.promotion.saved_amount > 0) insert_coll.push(getOrderTotalDict(order_id, 'promotion', cart.discount.promotion.name+' - '+cart.discount.promotion.saved_amount, -cart.discount.promotion.saved_amount, 3));
	insert_coll.push(getOrderTotalDict(order_id, 'shipping', '運費 - '+shipping_info.shipment_sel_str, shipping_info.shipment_fee, 4));
	if(cart.discount.voucher.saved_amount > 0) insert_coll.push(getOrderTotalDict(order_id, 'voucher', '禮券 - '+cart.discount.voucher.name, -cart.discount.voucher.saved_amount, 5));
	insert_coll.push(getOrderTotalDict(order_id, 'total', '訂單總計', shipping_info.total, 6));
	
	var sql = insertBulkSql('oc_order_total', insert_coll);
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query(sql, function(err, rows) {
			connection.release();
			if(err) {
				defer.reject(err);
			}
			defer.resolve(rows);
		});
	});
	return defer.promise;
};


var createCutomerReward = function(order_id = 0, customer_id = 0, description = '', points = 0) {
	var defer = q.defer();
	var insert_dict = {
		order_id: order_id,
		customer_id: customer_id,
		description: description,
		points: points,
		date_added: new Date()
	};
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query('INSERT INTO oc_customer_reward SET ?;', insert_dict, function(err, rows) {
			connection.release();
			if(err) {
				defer.reject(err);
			}
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

var createCouponHistory = function(order_id = 0, customer_id = 0, coupon_id = 0,  amount = 0) {
	var defer = q.defer();
	var insert_dict = {
		order_id: order_id,
		customer_id: customer_id,
		coupon_id: coupon_id,
		amount: amount,
		date_added: new Date()
	};
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query('INSERT INTO oc_coupon_history SET ?;', insert_dict, function(err, rows) {
			connection.release();
			if(err) {
				defer.reject(err);
			}
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

var createVoucherHistory = function(order_id = 0, voucher_id,  amount = 0) {
	var defer = q.defer();
	var insert_dict = {
		order_id: order_id,
		voucher_id: voucher_id,
		amount: amount,
		date_added: new Date()
	};
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query('INSERT INTO oc_voucher_history SET ?;', insert_dict, function(err, rows) {
			connection.release();
			if(err) {
				defer.reject(err);
			}
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

var lgetOrder = function(order_id) {
	var defer = q.defer();
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query('SELECT a.*, b.name as order_status_name FROM oc_order a, oc_order_status b WHERE a.order_id = ? and a.order_status_id = b.order_status_id and b.language_id = 2', [order_id], function(err, rows) {
			connection.release();
			if(err) defer.reject(err);
			if(_.size(rows) == 0) defer.reject('Error: getOrder no such order_id');	
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

var lgetOrderProduct = function(order_id) {
	var defer = q.defer();
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		} else {
			connection.query('SELECT * FROM oc_order_product WHERE order_id = ? order by order_product_id asc;', [order_id], function(err, rows) {
				connection.release();
				if(err) {
					defer.reject(err);
				} else if (_.size(rows) == 0) {
					defer.reject('Error: getOrderProduct no product from order_id');
				} else {
					defer.resolve(rows);
				}
			});
		}
	});
	return defer.promise;
};

var lgetOrderOption = function(order_id) {
	var defer = q.defer();
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		} else {
			connection.query('SELECT * FROM oc_order_option WHERE order_id = ? order by order_option_id asc;', [order_id], function(err, rows) {
				connection.release();
				if(err) {
					defer.reject(err);
				} else {
					defer.resolve(rows);
				}
			});
		}
	});
	return defer.promise;
};
// ################ Create "order", "order_totl", "order_product", "order_option", "coupon_history", "customer_reward" ###########
// ####
// ####
// ###############################################################################################################################
export function create(req, res) {
	var customer_id = req.user._id;
	var customer_group_id = req.user.customer_group_id;
	var customer_ip = req.ip;
	var email = req.user.email;
	var cart = req.body.cart;
	var shipping_info = req.body.shipping_info;

	shipping_info.total = cart.product_total_price + cart.shipment_fee - cart.discount.coupon.saved_amount - cart.discount.reward.saved_amount - cart.discount.voucher.saved_amount - cart.discount.promotion.saved_amount;;
	
	// Step 1. Create "Order"
	createOrder(shipping_info, customer_id, customer_group_id, email, customer_ip).then(function(data) {
		var order_id = data.insertId;
		var promises = [];
		try {
			// Step 2. Create "Order History" and "Order Product" and "Order Total" and "Product Stock Quantity"
			promises.push(createOrderHistory(order_id, shipping_info.order_status_id));
			promises.push(createOrderProduct(order_id, cart));
			promises.push(createOrderTotal(order_id, shipping_info, cart));
			promises.push(reduceProductQuantity(cart));

			// Step 3. Create "Customer Reward" and "Coupon History" and "Voucher History" if Used
			if(cart.discount.reward.saved_amount > 0) promises.push(createCutomerReward(order_id, customer_id, '使用於訂單 #'+order_id, -cart.discount.reward.saved_amount));
			if(cart.discount.coupon.saved_amount > 0) promises.push(createCouponHistory(order_id, customer_id, cart.discount.coupon.id, -cart.discount.coupon.saved_amount));
			if(cart.discount.voucher.saved_amount > 0) promises.push(createVoucherHistory(order_id, cart.discount.voucher.id, -cart.discount.voucher.saved_amount));
		}
		catch (e) {
			res.status(400).json(e);
		}
		q.all(promises).then(function(datas) {
			var order_product_query_responses = datas[1];
			var lpromises = [];
			for(var i = 0; i < cart.products.length; i++) {
				if(cart.products[i].option.length > 0) {
					try {
						// Step 4. Create "Order Option"
						lpromises.push(createOrderOption(order_id, order_product_query_responses[i].insertId, cart.products[i].option));
					}
					catch (e) {
						res.status(400).json(e);
					}
				}
			}
			if(lpromises.length > 0) {
				console.log('進入order option create');
				q.all(lpromises).then(function(data) {
					console.log('離開order create');
					res.status(200).json({order_id: order_id});
				}, function(err) {
					console.log(err);
					res.status(400).send(err);
				});
			} else {
				console.log('離開order create');
				res.status(200).json({order_id: order_id});
			}
		}, function(err) {
			console.log(err);
			res.status(400).send(err);
		});
	}, function(err) {
		console.log(err);
		res.status(400).send(err);
	});
};

export function updateOrder(req, res) {
	var customer_id = req.user._id;
	var order_id = req.params.order_id;
	var update_dict = req.body.update_dict;
	update_dict.date_modified = new Date();
	
	var sql = updateDictSql('oc_order', update_dict, {order_id: order_id, customer_id: customer_id});
	console.log(sql);
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			console.log(err);
			connection.release();
			res.status(400).send(err);
		}
		connection.query(sql, function(err, rows) {
			connection.release();
			if(err) {
				console.log(err);
				res.status(400).send(err);
			}
			res.status(200).json(rows);
		});
	});
};

export function insertOrderHistory(req, res) {
	var customer_id = req.user._id;
	var order_id = req.body.order_id;
	var insert_dict = req.body.insert_dict;

	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			res.status(400).send(err);
		}
		connection.query('SELECT * FROM oc_order WHERE order_id = ? AND customer_id = ?', [order_id, customer_id], function(err, rows) {
			connection.release();
			if(err) res.status(400).send(err);
			if(rows.length == 0) res.status(400).send('You Don\'t Have the Permission For This Order.');
			if(rows.length > 0) {
				createOrderHistory(order_id, insert_dict.order_status_id, insert_dict.notify || 0, insert_dict.comment).then(function(data) {
					res.status(200).json(data);
				}, function(err) {
					res.status(400).send(err);
				});
			}
		});
	});
};

export function getOrder(req, res) {
	var order_id = req.params.order_id;
	var customer_id = req.user._id;
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			res.status(400).json(err);
		}
		connection.query('SELECT * FROM oc_order WHERE order_id = ? and customer_id = ?', [order_id, customer_id], function(err, rows) {
			connection.release();
			if(err) res.status(400).json(err);
			if(_.size(rows) == 0) res.status(400).send('Error: getOrder no such order_id');	
			res.status(200).json(rows);
		});
	});
};

export function getOrderTotals(req, res) {
	var order_id = req.params.order_id;
	var customer_id = req.user._id;
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			res.status(400).json(err);
		}
		connection.query('SELECT * FROM oc_order_total WHERE order_id = ? order by sort_order asc', [order_id], function(err, rows) {
			connection.release();
			if(err) res.status(400).json(err);
			if(_.size(rows) == 0) res.status(400).send('Error: getOrderTotal no such order_id');	
			res.status(200).json(rows);
		});
	});	
};

export function getOrderProducts(req, res) {
	var order_id = req.params.order_id;
	var customer_id = req.user._id;
	var promises = [];
	promises.push(lgetOrder(order_id));
	promises.push(lgetOrderProduct(order_id));
	promises.push(lgetOrderOption(order_id));
	q.all(promises).then(function(datas) {
		var order = datas[0][0];
		if(order.customer_id !== customer_id) {
			res.status(400).send('You have no permission to query order: ' + order_id);
		} else {
			var order_product = datas[1];
			var order_option = datas[2];

			var result_obj = {
				order_id: order_id,
				total: order.total,
				order_status_id: order.order_status_id,
				order_status_name: order.order_status_name,
				payment_method: order.payment_method,
				shipping_method: order.shipping_method
			};
			result_obj['products'] = _.map(order_product, function(product) {
				var obj = {
					product_id: product.product_id,
					href: api_config.DIR_PATH + '?route=product/product&product_id=' + product.product_id,
					name: product.name,
					quantity: product.quantity,
					total: product.total,
					price: product.price
				}
				obj['options'] = _.filter(order_option, function(option) {
					return option.order_product_id == product.order_product_id;
				});
				return obj;
			});
			res.status(200).json(result_obj);
		}
	}, function(err) {
		res.status(400).json(err);
	});
};

export function deleteOrderResidual(order_id) {
	console.log('######  Cancel Order Discount Record for : ' + order_id);
	var defer = q.defer();
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		var sql = 'delete from oc_coupon_history where order_id = ' + order_id + ';';
		sql += 'delete from oc_customer_reward where order_id = ' + order_id + ';';
		sql += 'delete from oc_voucher_history where order_id = ' + order_id + ';';
		
		// Step 2. Delete all the records of this order_id
		connection.query(sql, function(err, rows) {
			connection.release();
			if(err) {
				defer.reject(err);
			} else {
				defer.resolve(rows);
			}
		});
	});
	return defer.promise;
};

export function lgetOrder(order_id) {
	var defer = q.defer();
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			defer.reject(err);
		}
		connection.query('SELECT * FROM oc_order WHERE order_id = ?', [order_id], function(err, rows) {
			connection.release();
			if(err) defer.reject(err);
			if(_.size(rows) == 0) defer.reject('Error: getOrder no such order_id');	
			defer.resolve(rows);
		});
	});
	return defer.promise;
};


// var insertAllProducts = function(){
// 	mysql_pool.getConnection(function(err, connection) {
// 		if(err) {
// 			connection.release();
// 		}
// 		connection.query('select * from oc_product_description where language_id = 7;', function(err, rows) {
// 			var insert_coll_1 = _.map(rows, function(product) {
// 				product.language_id = 1;
// 				return product;
// 			});
// 			var insert_coll_2 = _.map(rows, function(product) {
// 				product.language_id = 2;
// 				return product;
// 			});
// 			var sql = insertBulkSql('oc_product_description', insert_coll_1);
// 			sql += insertBulkSql('oc_product_description', insert_coll_2);
// 			connection.query(sql, function(err, result) {
// 				console.log(result);
// 			});
// 		});
// 	});
// };
// insertAllProducts();

