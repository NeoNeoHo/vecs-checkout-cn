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
import db_config from '../../config/db_config.js';
import api_config from '../../config/api_config.js';
import request from 'request';
import url from 'url';
import request_retry from 'requestretry';
import md5 from 'md5';
import crypto from 'crypto';
import q from 'q';

var mysql_pool = db_config.mysql_pool;
var mysql_config = db_config.mysql_config;  
var HOST_PATH = api_config.HOST_PATH;


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
		if(err) {
			connection.release();
			handleError(res, err);
		}
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
		if(err) { 
			connection.release();
			handleError(res, err); 
		}
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

	const CTO_key = 'd6c9be93579c';//'submitordertest==';
	const CTO_company_id = 'b884e56ea465441f85ddd34ac2a13fd1';//'ea8c719489de4ad0bf475477bad43dc6'; //'b884e56ea465441f85ddd34ac2a13fd1';
	const CTO_msg_type = 'PARTNERINSERT_SUBMITAGENT';

	mysql_pool.getConnection(function(err, connection) {
		if(err) { 
			connection.release();
			res.status(400).send(err); 
		}
		connection.query('SELECT * FROM oc_order WHERE order_id = ? AND customer_id = ?;', [order_id, customer_id], function(err, rows) {
			connection.release();
			if(err) res.status(400).send(err);
			if(_.size(rows) == 0) res.status(400).send('Error from send ezship order: no order record.');
			
			var order = rows[0];

			var order_data = {
				partner: 'ZTO1505198206811',
				id: '#' + order_id,
				typeid: '1',
				sender: {
					name: '嘉丹妮尔客服中心',
					mobile: '020-81200675',
					city: '广东省,广州市,荔湾区',
					address: '荔湾路49号之1,3楼306室,何济公综合大楼'
				},
				receiver: {
					id: customer_id,
					name: order.firstname,
					mobile: order.telephone,
					city: order.shipping_sub_district,
					address: order.shipping_address_1,
					zipcode: order.shipping_postcode
				},
				order_type: '0',
				price: order.total
			};
			var order_dict = {
				'company_id': CTO_company_id,
				'msg_type': CTO_msg_type,
				'data': JSON.stringify(order_data),
				'data_digest': crypto.createHash('md5').update(JSON.stringify(order_data)+CTO_key).digest('base64')
			};
			console.log(order_dict);
			request_retry.post({url: 'http://japi.zto.cn/gateway.do', form: order_dict, maxAttempts: 4, retryDelay: 1200}, function(err, lhttpResponse, body) {
				if(err) {
					console.log('######### ezship request fails , order_id: ###########');
					res.status(400).json(err);
				} else {
					console.log('中通回覆.........')
					console.log(body);
					res.status(200).json(body);	
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

var sendCTOrder = function() {
	console.log('######### CT Request Start ###########');
	const CTO_key = 'submitordertest==';//'d6c9be93579c';
	const CTO_company_id = 'ea8c719489de4ad0bf475477bad43dc6'; //'b884e56ea465441f85ddd34ac2a13fd1';
	const CTO_msg_type = 'PARTNERINSERT_SUBMITAGENT';
	var order_data = {
		partner: 'test',
		id: 'xfs101100111011',
		typeid: '1',
		sender: {
			name: '李琳',
			mobile: '13912345678',
			city: '上海市,上海市,青浦区',
			address: '华新镇华志路123号'
		},
		receiver: {
			name: '杨逸嘉',
			mobile: '13912345678',
			city: '上海市,上海市,青浦区',
			address: '华新镇华志路123号'
		},
		order_type: '0'
	};
	var order_dict = {
		'company_id': CTO_company_id,
		'msg_type': CTO_msg_type,
		'data': JSON.stringify(order_data),
		'data_digest': crypto.createHash('md5').update(JSON.stringify(order_data)+CTO_key).digest('base64')
	};
	request.post({header : {'Content-Type' : 'application/x-www-form-urlencoded'}, url: 'http://58.40.16.125:9001/gateway.do', form: order_dict}, function(err, lhttpResponse, body) {
		if(err) {
			console.log('######### CT request fails , order_id: ###########');
			console.log(err);
			res.status(400).json(err);
		} else {
			console.log(order_dict);
			console.log(body);
		}
	});
}

// sendCTOrder();

var getChinaArea = function() {
	console.log('######### CT Get Area Start ###########');
	request.get('http://japi.zto.cn/zto/api_utf8/baseArea?msg_type=GET_AREA&data=0', function(err, lhttpResponse, body) {
		if(err) {
			console.log('######### CT request fails , order_id: ###########');
			console.log(err);
		} else {
			var res_result = JSON.parse(body).result;
			mysql_pool.getConnection(function(err, connection){
				if(err) { 
					connection.release();
					handleError(res, err); 
				}
				var insert_coll = _.reduce(res_result, function(insert_coll, single_result) {
					insert_coll.push({
						country_id: 44,
						name: single_result.fullName,
						code: single_result.fullName,
						status: 1,
						postcode: single_result.code
					});
					return insert_coll;
				}, []);
				console.log(insert_coll)
				var insert_sql = insertBulkSql('oc_zone', insert_coll);
				connection.query(insert_sql,[] , function(err, result_coll) {
					connection.release();
					// Handle Query Process Error.
					if(err) console.log(err);
					else { 
						console.log(result_coll);
					}
				});
			});
		}
	});
}
// getChinaArea();

var getChinaCity = function(prov_postcode) {
	var defer = q.defer();
	request.get(`http://japi.zto.cn/zto/api_utf8/baseArea?msg_type=GET_AREA&data=${prov_postcode}`, function(err, lhttpResponse, body) {
		if(err) {
			console.log(`######### get City fails , postcode: ${prov_postcode} ###########`);
			defer.reject(err);
		} else {
			var res_result = JSON.parse(body).result;
			// console.log(res_result);
			defer.resolve(res_result);
		}
	})
	return defer.promise;
};

// getChinaCity(110113).then((result) => {console.log(result)});

var lala = function() {
	var defer = q.defer();
	mysql_pool.getConnection(function(err, connection){
		if(err) { 
			connection.release();
			handleError(res, err); 
		}
		connection.query('SELECT district_id, postcode from oc_district order by district_id asc;',[] , function(err, prov_result) {
			// Handle Query Process Error.
			if(err) {
				connection.release();
				console.log(err);
			}
			else { 
				console.log(prov_result);
				var lpromises = [];
				_.forEach(prov_result, function(row) {
					lpromises.push(getChinaCity(row.postcode));
				});
				q.all(lpromises).then((rows_of_coll) => {
					var counter = 0;
					var insert_coll = [];
					_.forEach(rows_of_coll, function(city_coll) {
						var this_prov = prov_result[counter];
						_.reduce(city_coll, function(insert_coll, city) {
							insert_coll.push({
								district_id: this_prov.district_id,
								postcode: city.code,
								name:  city.fullName,
								status: 1,
								printMark: city.printMark
							});
							return insert_coll;
						}, insert_coll);
						counter += 1;
					});
					console.log(insert_coll);
					var insert_sql = insertBulkSql('oc_sub_district', insert_coll);
					connection.query(insert_sql,[] , function(err, result_coll) {
						connection.release();
						// Handle Query Process Error.
						if(err) console.log(err);
						else { 
							// console.log(result_coll);
						}
					});
				});
			}
		});
	});
}
// lala();

