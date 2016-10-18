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
import Customer from './customer.model';
import db_config from '../../config/db_config.js';
import api_config from '../../config/api_config.js';
import unserialize from 'locutus/php/var/unserialize';
import serialize from 'locutus/php/var/serialize';
import request from 'request';
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

// Update
export function update(req, res) {
	var customer_id = req.user._id;
	var info = req.body;
	// console.log(info);
	mysql_pool.getConnection(function(err, connection){
		if(err) {
			connection.release();
			handleError(res, err);
		}
		connection.query('update '+ mysql_config.db_prefix + 'customer set ? where customer_id = ? ',[info, customer_id] , function(err, rows) {
			connection.release();
			if(err) handleError(res, err);
			res.status(200).json(rows);
		});

	});
}

export function get(req, res) {
	var customer_id = req.params.id;
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			handleError(res, err);
		}
		connection.query('SELECT * from '+ mysql_config.db_prefix + 'customer where customer_id = ? ',[customer_id] , function(err, rows) {
			connection.release();
			if(err) handleError(res, err);
			res.status(200).json(rows);
		});
	});
}

export function updateCart(req, res) {
	var cart = req.body.cart_products;
	var customer_id = req.user._id;

	var result = _.reduce(cart, function(result, product) {
		result[new Buffer(serialize({"product_id":product.product_id}), 'ascii').toString('base64')] = product.quantity;
		return result;
	}, {});
	var serialize_result = serialize(result);
	// console.log(serialize_result);
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			connection.release();
			handleError(res, err);
		}
		connection.query('update ' + mysql_config.db_prefix + 'customer set cart = ? where customer_id = ?', [serialize_result, customer_id], function(err, rows) {
			connection.release();
			if(err) handleError(res, err);
			res.status(200).json((serialize_result));
		});
	});
}

export function clearCart(req, res) {
	var customer_id = req.user._id;
	console.log('clearCart');
	res.redirect(api_config.DIR_PATH+'index.php?route=checkout/cart/clear');
}
