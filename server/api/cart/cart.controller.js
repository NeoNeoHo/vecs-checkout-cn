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
import redis from 'redis';
import unserialize from 'locutus/php/var/unserialize';
import serialize from 'locutus/php/var/serialize';
import PHPUnserialize from 'php-unserialize';


var mysql_pool = db_config.mysql_pool;
var mysql_config = db_config.mysql_config;  


// ################ Create "order", "order_totl", "order_product", "order_option", "coupon_history", "customer_reward" ###########
// ####
// ####
// ###############################################################################################################################
var getProductOptionValue = function(product_option_value_ids) {
	var defer = q.defer();
	mysql_pool.getConnection(function(err, connection) {
		if(err) defer.reject(err);
		connection.query('SELECT * from ' + mysql_config.db_prefix + 'product_option_value where product_option_value_id in (?)', [product_option_value_ids], function(err, rows) {
			connection.release();
			if(err) defer.reject(err);
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

var getOptionDetail= function(option_id, option_value_id) {
	var defer = q.defer();
	mysql_pool.getConnection(function(err, connection) {
		if(err) defer.reject(err);
		connection.query('SELECT a.name as name, b.name as value from ' + mysql_config.db_prefix + 'option_description a, ' + mysql_config.db_prefix + 'option_value_description b where a.option_id = ? and a.language_id = 2 and b.option_value_id = ? and b.language_id = 2', [option_id, option_value_id], function(err, rows) {
			connection.release();
			if(err) defer.reject(err);
			var result = rows[0] || rows;
			defer.resolve(result);
		});
	});
	return defer.promise;
};

var getProductOptions = function(product_option_id, product_option_value_ids, product_key){
	var defer = q.defer();
	getProductOptionValue(product_option_value_ids).then(function(rows) {
		var promises = [];
		var results = [];
		_.forEach(rows, function(row) {
			results.push({product_option_id: product_option_id, product_option_value_id: row.product_option_value_id, price: row.price})
			promises.push(getOptionDetail(row.option_id, row.option_value_id));
		});
		q.all(promises).then(function(datas) {
			for(var i = 0; i<_.size(datas); i++) {
				results[i].name = datas[i].name;
				results[i].value = datas[i].value;
				results[i].type = datas[i].name;
			}
			var result_obj = {
				product_key: product_key,
				option: results
			};
			// console.log(results);
			defer.resolve(result_obj);
		}, function(err) {
			console.log(err);
			defer.reject(err);
		});
	}, function(err) {
		console.log(err);
		defer.reject(err);
	});
	return defer.promise;
};

var cartCollToSerialize = function(cart_coll) {
	var result = _.reduce(cart_coll, function(result, product) {
		var temp_obj = product.option ? {"product_id": product.product_id, "option": product.option} : {"product_id": product.product_id};
		result[new Buffer(serialize(temp_obj), 'ascii').toString('base64')] = product.quantity;
		return result;
	}, {});
	var serialize_result = serialize(result);
	return serialize_result;
};

var UnserializeToCartColl = function(cart_obj) {
	var defer = q.defer();
	var option_promises = [];
	var cart_coll = _.map(_.keys(cart_obj), function(lkey){
		var obj = unserialize(new Buffer(lkey, 'base64'), 'ascii');
		obj.quantity = cart_obj[lkey];
		obj.product_key = lkey;
		obj.key = lkey;
		obj.href = api_config.DIR_PATH + 'index.php?route=product/product&product_id=' + obj.product_id;
		if(obj.option){
			_.forEach(_.keys(obj.option), function(option_key) {
				option_promises.push(getProductOptions(option_key, obj.option[option_key], obj.product_key));
			});
		} else {
			obj.option = [];
		}
		return obj;
	});
	if(_.size(option_promises) == 0) {
		defer.resolve(cart_coll);
	}
	q.all(option_promises).then(function(datas) {
		_.forEach(datas, function(lproduct_option) {
			_.map(cart_coll, function(obj){
				if(obj.product_key == lproduct_option.product_key){
					obj.option = lproduct_option.option;
				}
				return obj;
			});
		});
		defer.resolve(cart_coll);
	}, function(err) {
		defer.resolve(cart_coll);
	});
	
	return defer.promise;
}

var jsonToPHPSerializeSession = function(obj) {
	var result = _.reduce(_.keys(obj), function(result, lkey){
		result += lkey + '|' + serialize(obj[lkey]);
		return result;
	}, '');
	return result;
};

var getSession = function(session_id) {
	var defer = q.defer();
	var sess_obj = '';
	try {
		var client = redis.createClient();
		client.get(session_id, function(err, reply) {
			if(err) defer.reject(err);
			// 1. Unserialize PHP Session To readable JSON format
			if(reply){
				console.log(reply);
				sess_obj = JSON.parse(reply);
				defer.resolve(sess_obj);
			} else {
				defer.reject('no session');
			}
		});
		client.quit();
	}
	catch (e) {
		console.log(e);
		defer.reject('no session');
	}
	return defer.promise;
};

export function getSession(req, res) {
	var session_id = api_config.SESSION_ID + ':' +req.user.session_id;
	var sess_obj = '';
	console.log(session_id);
	try {
		var client = redis.createClient();
		client.get(session_id, function(err, reply) {
			if(reply){
				console.log(JSON.parse(reply));
				sess_obj = JSON.parse(reply);
				console.log(sess_obj.cart);
				// 2. Unserialize cart string to cart JSON
				UnserializeToCartColl(sess_obj.cart).then(function(data) {
					var cart_coll = data;
					// 3. Assign cart JSON back to sess_obj
					sess_obj.cart = cart_coll;
					// 4. Return JSON
					res.status(200).json(sess_obj);
				});
				
			} else {
				res.status(400).send('no session');
			}
		});
		client.quit();
	}
	catch (e) {
		console.log(e);
		res.status(400).send('no session');
	}
};

export function updateProducts(req, res) {
	var session_id = api_config.SESSION_ID + ':' + req.user.session_id;
	var update_products = req.body.update_products; //[{product_key:'fda', quantity: 1}]
	getSession(session_id).then(function(sess_obj) {
		if(update_products){
			var cart = {};
			_.forEach(update_products, function(product) {
				if(product.product_key){
					cart[product.product_key] = product.quantity;
				}
			});
			req.session.cart = cart;
			res.status(200).json('ok');
		} else {
			res.status(200).json('ok');
		}
	}, function(err) {
		console.log(err);
		res.status(400).json(err);
	});
};

export function deleteCart(req, res) {
	var session_id = api_config.SESSION_ID + ':' + req.user.session_id;
	getSession(session_id).then(function(sess_obj) {
		if(sess_obj.cart){
			req.session.cart = '';
			res.status(200).json('ok');
		} else {
			res.status(200).json('ok');
		}
	}, function(err) {
		console.log(err);
		res.status(400).json(err);
	});
};