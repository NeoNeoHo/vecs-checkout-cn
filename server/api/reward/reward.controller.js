/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/rewards              ->  index
 * POST    /api/rewards              ->  create
 * GET     /api/rewards/:id          ->  show
 * PUT     /api/rewards/:id          ->  update
 * DELETE  /api/rewards/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import Reward from './reward.model';
import db_config from '../../config/db_config.js';
var mysql_pool = db_config.mysql_pool;
var mysql_config = db_config.mysql_config;  

function respondWithResult(res, entity, statusCode) {
	statusCode = statusCode || 200;
	if (entity || entity[0]) {
		res.status(statusCode).json(entity);
	}
}


function handleError(res, err_msg, statusCode) {
	statusCode = statusCode || 500;
	res.status(statusCode).send(err_msg);
}

// Update
export function getCustomerReward(req, res) {
	var customer_id = req.user._id;
	var info = req.body;
	mysql_pool.getConnection(function(err, connection){
		if(err) {
			connection.release();
			handleError(res, err.message);
		}
		// console.log(connection.escape(customer_id));
		connection.query('select sum(points) as points from '+ mysql_config.db_prefix + 'customer_reward where customer_id = ? ',[customer_id] , function(err, rows) {
			connection.release();
			if(err) handleError(res, err.message);
			// console.log(rows);
			res.status(200).json(rows[0]);
		});

	});
}
