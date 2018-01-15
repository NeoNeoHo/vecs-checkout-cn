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
import q from 'q';

const mysql_pool = db_config.mysql_pool;
const mysql_config = db_config.mysql_config;  

export function getBuyXGetY(req, res) {
	var is_started = true;
	if (is_started) {
		var content = {
			category_ids: [146],
			product_ids: 'all', 
			X: 3,
			Y: 1,
			description: '買三送一'
		};
		if (content.category_ids !== 'all' && content.product_ids === 'all') {
			mysql_pool.getConnection(function(err, connection) {
				if(err) {
					connection.release();
					return res.status(200).json({status: true, content: content});
				}
				var sql = 'select product_id from oc_product_to_category where category_id in (?);';
				connection.query(sql, content.category_ids, function(err, rows) {
					connection.release();
					if(err) {
						return res.status(200).json({status: true, content: content});
					}
					content.product_ids = _.map(rows, 'product_id');
					return res.status(200).json({status: true, content: content});
				});
			});
		} else {
			return res.status(200).json({status: true, content: content});
		}
	} else {
		return res.status(200).json({status: false});
	}
};

