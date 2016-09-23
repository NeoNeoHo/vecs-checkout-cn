/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/ezships              ->  index
 * POST    /api/ezships              ->  create
 * GET     /api/ezships/:id          ->  show
 * PUT     /api/ezships/:id          ->  update
 * DELETE  /api/ezships/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import Ezship from './ezship.model';
import db_config from '../../config/db_config.js';
import api_config from '../../config/api_config.js';
import request from 'request';
import url from 'url';
import request_retry from 'requestretry';

var mysql_pool = db_config.mysql_pool;
var mysql_config = db_config.mysql_config;  
var HOST_PATH = api_config.HOST_PATH;

function respondWithResult(res, entity, statusCode) {
	statusCode = statusCode || 200;
	if (entity[0]) {
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

export function upsertHistory(req, res) {
	var customer_id = req.user._id;
	var content = req.body;
	if(!content) handleError(res, 'Err No content to update ezship order');
	var obj = {
		customer_id : customer_id,
		stCate : content.stCate || '',
		stCode : content.stCode || '',
		stName : content.stName || '',
		stAddr : content.stAddr || '',
		stTel : content.stTel || ''
	};
	mysql_pool.getConnection(function(err, connection){
		if(err) handleError(res, err);
		connection.query('insert into oc_customer_ezship_history set ?',obj, function(err, rows) {
			if(err) {
				// connection.query('update oc_customer_ezship_history set ? where customer_id = ?',[obj, customer_id] , function(err, rows) {
					connection.release();
					// if(err) handleError(res, err);
					res.redirect(HOST_PATH + '/checkout/shipment_payment?shipment=ship_to_store');
				// });
			}
			else {
				connection.release();
				res.redirect(HOST_PATH + '/checkout/shipment_payment?shipment=ship_to_store');
			}
		});
	});
}

export function getHistory(req, res) {
	var customer_id = req.user._id;
	mysql_pool.getConnection(function(err, connection){
		if(err) { handleError(res, err); }
		connection.query('select * from oc_customer_ezship_history where customer_id = ? order by ezship_history_id desc limit 1;',[customer_id] , function(err, result_coll) {
			connection.release();
			// Handle Query Process Error.
			if(err) handleError(res, err);
			// Handle Empty Query Result.
			if(_.size(result_coll) == 0) res.status(404).end();
			// Query Successfully.
			else { 
				res.status(200).json(result_coll);
			}
		});
	});
}


export function sendOrder(req, res) {
	var customer_id = req.user._id;
	var order_id = req.body.order_id;
	var order_type = req.body.order_type;
	mysql_pool.getConnection(function(err, connection) {
		if(err) { res.status(400).send(err); }
		connection.query('SELECT * FROM oc_order WHERE order_id = ? AND customer_id = ?;', [order_id, customer_id], function(err, rows) {
			connection.release();
			if(err) res.status(400).send(err);
			if(_.size(rows) == 0) res.status(400).send('Error from send ezship order: no order record.');
			
			var order = rows[0];
			var order_dict = {
				su_id: 'shipping@vecsgardenia.com',
				order_id: order_id,
				order_status: 'A01',
				order_type: order_type,
				order_amount: (order_type == 1) ? order.total : 0,
				rv_name: order.firstname,
				rv_email: order.email,
				rv_mobile: order.telephone,
				st_code: order.shipping_country,
				rtn_url: HOST_PATH + '/api/ezships/receiveOrder/',
				web_para: 'fjdofijasdifosdjf'
			};

			request_retry.post({url: 'https://www.ezship.com.tw/emap/ezship_request_order_api.jsp', form: order_dict, maxAttempts: 4, retryDelay: 1200}, function(err, lhttpResponse, body) {
				if(err) {
					// console.log('The number of request attempts: ' + lhttpResponse.attempts);
					console.log('######### ezship request fails , order_id: ###########');
					console.log(err);
					console.log(order_dict);
					res.status(400).json(err);
				} else {
					console.log('The number of request attempts: ' + lhttpResponse.attempts);
					console.log(order_dict);
					var result = (lhttpResponse) ? url.parse(lhttpResponse.headers.location, true).query : {order_status: 'Error'};
					if(result.order_status !== 'S01') {
						res.status(400).json({ezship_order_status: result.order_status, msg: '設定超商失敗'});
					} else {
						console.log('receives ezship response');
						res.status(200).json(result);
					}	
				}
			});
			// res.status(200).json(rows);
		});
	});
}

export function receiveOrder(req, res) {
	console.log('Receive From Ezship');
	var content = req.query;
	if(!content) handleError(res, 'Err No content to update ezship order');
	console.log(content);
	// res.redirect('/showCheckout');
}
