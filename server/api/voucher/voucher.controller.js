/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/coupons              ->  index
 * POST    /api/coupons              ->  create
 * GET     /api/coupons/:id          ->  show
 * PUT     /api/coupons/:id          ->  update
 * DELETE  /api/coupons/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import db_config from '../../config/db_config.js';
import moment from 'moment';
import q from 'q';
var mysql_pool = db_config.mysql_pool;
var mysql_config = db_config.mysql_config;

function respondWithResult(res, entity, statusCode) {
	statusCode = statusCode || 200;
	if (entity) {
		res.status(statusCode).json(entity);
	}
}

function handleEntityNotFound(res, entity) {
	if (!entity[0]) {
		res.status(404).end('ERROR 404');
	}
}

function handleError(res, err_msg, statusCode) {
	statusCode = statusCode || 500;
	res.status(statusCode).send(err_msg);
}



// Gets a single Coupon from the DB
export function show(req, res) {
	var promises = [];
	var voucher_code = req.params.code;
	console.log(voucher_code);
	if(!voucher_code) handleError(res, 'You should keyin a voucher_code !!');
	promises.push(getVoucher(voucher_code));
	promises.push(getVoucherHistory(voucher_code));

	q.all(promises).then(function(results) {
		var voucher = results[0][0] || results[0], voucher_history = results[1];
		console.log(results);
		var lresponse = {
			'status': true,
			'available_amount': 0,
			'voucher_id': voucher.voucher_id
		};
		if (voucher.length == 0) { lresponse.status = false}
		else {
			var used_amount = _.reduce(voucher_history, function(sum, lhistory) {
				sum += (-1 * parseInt(lhistory.amount));
				return sum;
			}, 0);
			var qouta_amount = voucher.amount;
			lresponse['available_amount'] = (qouta_amount > used_amount) ? (qouta_amount - used_amount) : 0;
		}
		console.log(lresponse);
		respondWithResult(res, lresponse);
	}, function(err) {
		handleError(res, err.message);
	});
}

var getVoucher = function(code) {
	var defer = q.defer();
	mysql_pool.getConnection(function(err, connection){
		if(err) { 
			connection.release();
			defer.reject(err);
		}
		var sql = 'select * from oc_voucher where code =' + connection.escape(code) + ';';
		connection.query(sql, function(err, rows) {
			connection.release();
			if(err) defer.reject(err);
			// if(rows.length == 0) defer.reject(new Error('沒有此一禮券'));
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

var getVoucherHistory = function(code) {
	var defer = q.defer();
	mysql_pool.getConnection(function(err, connection){
		if(err) { 
			connection.release();
			defer.reject(err);
		}
		var sql = 'select a.* from oc_voucher_history a, oc_voucher b where a.voucher_id = b.voucher_id and b.code =' + connection.escape(code) + ';';
		connection.query(sql, function(err, rows) {
			connection.release();
			if(err) defer.reject(err);
			defer.resolve(rows);
		});
	});
	return defer.promise;
};

